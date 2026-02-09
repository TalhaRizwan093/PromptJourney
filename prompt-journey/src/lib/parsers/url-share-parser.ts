/**
 * Shared URL Parser
 * Fetches and parses shared conversation links from ChatGPT, Claude, and Gemini.
 */

export interface ParsedMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ParsedSharedChat {
  platform: "chatgpt" | "claude" | "gemini" | "unknown";
  title: string;
  messages: ParsedMessage[];
}

export interface JourneyStep {
  id: string;
  title: string;
  prompt: string;
  result: string;
  notes: string;
}

// ─── URL Detection ─────────────────────────────────────────────────

type Platform = "chatgpt" | "claude" | "gemini" | "unknown";

export function detectPlatformFromUrl(url: string): Platform {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("chatgpt.com") || host.includes("chat.openai.com")) return "chatgpt";
    if (host.includes("claude.ai")) return "claude";
    if (host.includes("gemini.google.com") || host.includes("g.co")) return "gemini";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export function isValidShareUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const platform = detectPlatformFromUrl(url);
    if (platform === "unknown") return false;
    // Must have a share path segment
    return u.pathname.includes("/share");
  } catch {
    return false;
  }
}

// ─── Main Fetcher ──────────────────────────────────────────────────

export async function fetchAndParseSharedChat(url: string): Promise<ParsedSharedChat> {
  const platform = detectPlatformFromUrl(url);

  // Fetch the page HTML
  const html = await fetchPage(url);

  switch (platform) {
    case "chatgpt":
      return parseChatGPTShare(html, url);
    case "claude":
      return parseClaudeShare(html, url);
    case "gemini":
      return parseGeminiShare(html, url);
    default:
      // Try generic parsing
      return parseGenericShare(html);
  }
}

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    // For Gemini, add consent cookies to bypass the consent redirect
    const isGemini = url.includes("gemini.google.com");
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    };
    if (isGemini) {
      headers["Cookie"] = "CONSENT=PENDING+987; SOCS=CAESEwgDEgk2MjczOTEyOTYaAmVuIAEaBgiA_J-6Bg";
    }

    const res = await fetch(url, {
      signal: controller.signal,
      headers,
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: HTTP ${res.status}. The shared link may be expired or invalid.`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

// ─── React Router Turbo-Stream Parser (ChatGPT 2025+ format) ─────

/**
 * Resolves a turbo-stream descriptor object from the flat array.
 * Format: {"_N": M, ...} where N = position of key string, M = position of value.
 */
function resolveTurboObj(
  arr: unknown[],
  descriptor: unknown
): Record<string, unknown> | null {
  if (!descriptor || typeof descriptor !== "object" || Array.isArray(descriptor)) return null;
  const result: Record<string, unknown> = {};
  for (const [refKey, valPos] of Object.entries(descriptor as Record<string, unknown>)) {
    if (!refKey.startsWith("_")) continue;
    const keyPos = parseInt(refKey.slice(1));
    if (isNaN(keyPos) || keyPos < 0 || keyPos >= arr.length) continue;
    const key = arr[keyPos];
    if (typeof key !== "string") continue;
    if (typeof valPos === "number") {
      if (valPos < 0) {
        result[key] = null;
      } else if (valPos < arr.length) {
        result[key] = arr[valPos];
      }
    }
  }
  return result;
}

/**
 * Resolves turbo-stream array elements (position references → actual values).
 */
function resolveTurboArray(arr: unknown[], refs: unknown[]): unknown[] {
  return refs.map((ref) => {
    if (typeof ref === "number" && ref >= 0 && ref < arr.length) {
      return arr[ref];
    }
    return ref;
  });
}

function extractFromTurboStream(
  html: string
): { title: string; messages: ParsedMessage[] } | null {
  // ChatGPT uses React Router streaming: window.__reactRouterContext.streamController.enqueue("...")
  const enqueuePattern = /streamController\.enqueue\("((?:[^"\\]|\\.)*)"\)/g;
  let match;

  while ((match = enqueuePattern.exec(html)) !== null) {
    try {
      // Double-parse: JS string unescape → JSON array
      const unescaped = JSON.parse('"' + match[1] + '"');
      const arr = JSON.parse(unescaped) as unknown[];
      if (!Array.isArray(arr) || arr.length < 50) continue;

      let title = "";
      const messages: ParsedMessage[] = [];

      // Find title
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === "title" && typeof arr[i + 1] === "string" && !title) {
          const t = arr[i + 1] as string;
          if (t.length > 0 && t.length < 300) title = t;
        }
      }

      // Find "linear_conversation" (ordered node list) — preferred
      let linearConversation: unknown[] | null = null;
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === "linear_conversation" && Array.isArray(arr[i + 1])) {
          linearConversation = arr[i + 1] as unknown[];
          break;
        }
      }

      // Extract messages from the node list
      const extractFromNodes = (nodeRefs: unknown[]) => {
        for (const nodeRef of nodeRefs) {
          if (typeof nodeRef !== "number" || nodeRef < 0 || nodeRef >= arr.length) continue;
          const nodeDescriptor = arr[nodeRef];
          const node = resolveTurboObj(arr, nodeDescriptor);
          if (!node || !node.message) continue;

          const msg = resolveTurboObj(arr, node.message);
          if (!msg || !msg.author) continue;

          const author = resolveTurboObj(arr, msg.author);
          if (!author) continue;
          const role = author.role as string;
          if (role !== "user" && role !== "assistant") continue;

          const content = resolveTurboObj(arr, msg.content);
          if (!content) continue;
          const partsRaw = content.parts;
          if (!Array.isArray(partsRaw)) continue;

          const resolvedParts = resolveTurboArray(arr, partsRaw);
          const textParts: string[] = [];
          for (const part of resolvedParts) {
            if (typeof part === "string" && part.trim().length > 0) {
              textParts.push(part.trim());
            }
          }
          if (textParts.length > 0) {
            messages.push({
              role: role as "user" | "assistant",
              content: textParts.join("\n"),
            });
          }
        }
      };

      if (linearConversation && linearConversation.length > 0) {
        extractFromNodes(linearConversation);
      } else {
        // Fallback: use "mapping" (unordered dict of nodes)
        for (let i = 0; i < arr.length - 1; i++) {
          if (
            arr[i] === "mapping" &&
            typeof arr[i + 1] === "object" &&
            arr[i + 1] !== null &&
            !Array.isArray(arr[i + 1])
          ) {
            const mappingDescriptor = arr[i + 1] as Record<string, unknown>;
            const nodeRefs = Object.values(mappingDescriptor).filter(
              (v): v is number => typeof v === "number" && v >= 0
            );
            extractFromNodes(nodeRefs);
            break;
          }
        }
      }

      if (messages.length > 0) {
        return { title, messages };
      }
    } catch {
      continue;
    }
  }

  return null;
}

// ─── ChatGPT Parser ───────────────────────────────────────────────

function parseChatGPTShare(html: string, _url: string): ParsedSharedChat {
  const messages: ParsedMessage[] = [];
  let title = "ChatGPT Shared Conversation";

  // Strategy 1: React Router turbo-stream (current ChatGPT format, 2025+)
  const turboResult = extractFromTurboStream(html);
  if (turboResult && turboResult.messages.length > 0) {
    return {
      platform: "chatgpt",
      title: turboResult.title || title,
      messages: turboResult.messages,
    };
  }

  // Strategy 2: Parse __NEXT_DATA__ JSON (older format, pre-2025)
  const nextDataMatch = html.match(
    /<script\s+id="__NEXT_DATA__"\s+type="application\/json"[^>]*>([\s\S]*?)<\/script>/
  );
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const serverResponse =
        nextData?.props?.pageProps?.serverResponse?.data ||
        nextData?.props?.pageProps?.data ||
        nextData?.props?.pageProps;

      if (serverResponse) {
        title = serverResponse.title || title;

        // Parse mapping structure
        const mapping = serverResponse.mapping || serverResponse.linear_conversation;
        if (mapping && typeof mapping === "object") {
          const nodes = Array.isArray(mapping)
            ? mapping
            : Object.values(mapping);

          for (const node of nodes as Record<string, unknown>[]) {
            const msg = (node.message || node) as Record<string, unknown>;
            if (!msg) continue;

            const author = msg.author as Record<string, string> | undefined;
            const role = author?.role || (msg.role as string);
            const content = msg.content as Record<string, unknown> | undefined;

            let text = "";
            if (content?.parts) {
              text = (content.parts as unknown[])
                .filter((p) => typeof p === "string")
                .join("\n");
            } else if (typeof content === "string") {
              text = content;
            } else if (typeof msg.text === "string") {
              text = msg.text;
            }

            if (text.trim() && (role === "user" || role === "assistant")) {
              messages.push({ role: role as "user" | "assistant", content: text.trim() });
            }
          }
        }
      }
    } catch {
      // Fall through to HTML parsing
    }
  }

  // Strategy 3: Parse JSON-LD or other embedded JSON
  if (messages.length === 0) {
    const jsonScripts = html.matchAll(
      /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g
    );
    for (const m of jsonScripts) {
      try {
        const data = JSON.parse(m[1]);
        extractMessagesFromJson(data, messages);
        if (messages.length > 0) break;
      } catch {
        continue;
      }
    }
  }

  // Strategy 4: Parse HTML structure with data-message-author-role
  if (messages.length === 0) {
    parseHtmlMessages(html, messages, {
      userSelectors: [
        /data-message-author-role="user"/,
        /class="[^"]*\buser-message\b[^"]*"/,
      ],
      assistantSelectors: [
        /data-message-author-role="assistant"/,
        /class="[^"]*\bassistant-message\b[^"]*"/,
      ],
      turnSelector: /data-message-author-role="(user|assistant)"/g,
    });
  }

  // Strategy 5: Look for alternating divs with specific patterns
  if (messages.length === 0) {
    const turnPattern =
      /data-message-author-role="(user|assistant)"[^>]*>[\s\S]*?<div[^>]*class="[^"]*markdown[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*data-message-author-role|$)/g;
    let match;
    while ((match = turnPattern.exec(html)) !== null) {
      messages.push({
        role: match[1] as "user" | "assistant",
        content: stripHtml(match[2]),
      });
    }
  }

  // Strategy 6: Generic text extraction as last resort
  if (messages.length === 0) {
    extractFromGenericHtml(html, messages);
  }

  // Try to get title from <title> tag
  if (title === "ChatGPT Shared Conversation") {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      const t = titleMatch[1].replace(/\s*[-|]?\s*ChatGPT\s*$/i, "").trim();
      if (t && t.length > 2) title = t;
    }
  }

  return { platform: "chatgpt", title, messages };
}

// ─── Claude Parser ────────────────────────────────────────────────

function parseClaudeShare(html: string, _url: string): ParsedSharedChat {
  const messages: ParsedMessage[] = [];
  let title = "Claude Shared Conversation";

  // Detect Cloudflare challenge / bot protection (Claude uses this)
  if (
    html.length < 20000 &&
    (html.includes("Just a moment...") ||
      html.includes("challenge-platform") ||
      html.includes("cf-browser-verification"))
  ) {
    throw new Error(
      "Claude's share page is protected by Cloudflare bot detection and cannot be accessed from a server. " +
      "Please use the \"Paste Conversation\" tab instead: open the Claude share link in your browser, " +
      "select all the conversation text (Ctrl+A), copy it (Ctrl+C), and paste it into the paste tab."
    );
  }

  // Strategy 1: Parse Next.js RSC chunks from <script> tags
  // Claude uses Next.js App Router with RSC (React Server Components)
  const rscMessages = extractFromClaudeRSC(html);
  if (rscMessages.length > 0) {
    messages.push(...rscMessages);
  }

  // Strategy 2: React Router turbo-stream
  if (messages.length === 0) {
    const turboResult = extractFromTurboStream(html);
    if (turboResult && turboResult.messages.length > 0) {
      return {
        platform: "claude",
        title: turboResult.title || title,
        messages: turboResult.messages,
      };
    }
  }

  // Strategy 3: Look for embedded JSON data (SvelteKit / Next / Nuxt)
  if (messages.length === 0) {
    const jsonPatterns = [
      /<script[^>]*id="__(?:NEXT|NUXT|SVELTE)_DATA__"[^>]*>([\s\S]*?)<\/script>/,
      /<script[^>]*>window\.__(?:data|INITIAL_STATE__|claude)__?\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/,
      /<script[^>]*type="application\/json"[^>]*data-sveltekit[^>]*>([\s\S]*?)<\/script>/,
    ];

    for (const pattern of jsonPatterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          extractClaudeMessages(data, messages);
          if (messages.length > 0) {
            title = extractTitle(data) || title;
            break;
          }
        } catch {
          continue;
        }
      }
    }
  }

  // Strategy 4: Try ALL JSON script tags
  if (messages.length === 0) {
    const jsonScripts = html.matchAll(
      /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g
    );
    for (const m of jsonScripts) {
      try {
        const data = JSON.parse(m[1]);
        extractClaudeMessages(data, messages);
        if (messages.length === 0) {
          extractMessagesFromJson(data, messages);
        }
        if (messages.length > 0) {
          title = extractTitle(data) || title;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  // Strategy 5: Parse HTML structure
  if (messages.length === 0) {
    const turnPattern =
      /class="[^"]*(?:human|user)-(?:turn|message|content)[^"]*"[^>]*>([\s\S]*?)(?=class="[^"]*(?:assistant|ai)-(?:turn|message|content)|class="[^"]*(?:human|user)-(?:turn|message|content)|$)/gi;
    const assistantPattern =
      /class="[^"]*(?:assistant|ai)-(?:turn|message|content)[^"]*"[^>]*>([\s\S]*?)(?=class="[^"]*(?:human|user)-(?:turn|message|content)|class="[^"]*(?:assistant|ai)-(?:turn|message|content)|$)/gi;

    let match;
    const userTurns: string[] = [];
    const assistantTurns: string[] = [];

    while ((match = turnPattern.exec(html)) !== null) {
      userTurns.push(stripHtml(match[1]));
    }
    while ((match = assistantPattern.exec(html)) !== null) {
      assistantTurns.push(stripHtml(match[1]));
    }

    for (let i = 0; i < Math.max(userTurns.length, assistantTurns.length); i++) {
      if (userTurns[i]?.trim()) messages.push({ role: "user", content: userTurns[i].trim() });
      if (assistantTurns[i]?.trim()) messages.push({ role: "assistant", content: assistantTurns[i].trim() });
    }
  }

  // Strategy 6: data-role attributes
  if (messages.length === 0) {
    const rolePattern =
      /(?:data-)?role="(human|user|assistant)"[^>]*>([\s\S]*?)(?=(?:data-)?role="(?:human|user|assistant)"|$)/gi;
    let match;
    while ((match = rolePattern.exec(html)) !== null) {
      const role = match[1] === "human" ? "user" : match[1] as "user" | "assistant";
      const content = stripHtml(match[2]);
      if (content.trim()) messages.push({ role, content: content.trim() });
    }
  }

  // Strategy 7: Generic fallback
  if (messages.length === 0) {
    extractFromGenericHtml(html, messages);
  }

  // If still no messages, throw a helpful error
  if (messages.length === 0) {
    throw new Error(
      "Could not extract conversation data from this Claude share link. " +
      "Claude share pages load content dynamically which makes server-side parsing difficult. " +
      "Please use the \"Paste Conversation\" tab instead: open the share link in your browser, " +
      "select all text (Ctrl+A), copy (Ctrl+C), and paste it here."
    );
  }

  // Title from page
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && title === "Claude Shared Conversation") {
    const t = titleMatch[1].replace(/\s*[-|]?\s*Claude\s*$/i, "").trim();
    if (t && t.length > 2) title = t;
  }

  return { platform: "claude", title, messages };
}

/**
 * Extract messages from Claude's RSC (React Server Components) chunks.
 * Claude uses Next.js App Router which embeds data in self.__next_f.push() calls.
 */
function extractFromClaudeRSC(html: string): ParsedMessage[] {
  const messages: ParsedMessage[] = [];

  // Extract all <script> contents and look for RSC data
  const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  let allRscContent = "";

  while ((scriptMatch = scriptPattern.exec(html)) !== null) {
    const content = scriptMatch[1];
    if (!content.includes("self.__next_f")) continue;

    // Extract push() call data
    const pushPattern = /self\.__next_f\.push\(\[(\d+),"([\s\S]*?)"\]\)/g;
    let pushMatch;
    while ((pushMatch = pushPattern.exec(content)) !== null) {
      let data = pushMatch[2];
      // Unescape JS string
      data = data
        .replace(/\\u003c/g, "<")
        .replace(/\\u003e/g, ">")
        .replace(/\\u0026/g, "&")
        .replace(/\\u0027/g, "'")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
      allRscContent += data;
    }
  }

  if (!allRscContent) return messages;

  // Look for conversation data in the RSC content
  // Claude RSC pages embed conversation as JSON within the component tree
  // Try to find chat_messages or similar patterns
  const chatMsgPattern = /"chat_messages"\s*:\s*(\[[\s\S]*?\])/;
  const chatMsgMatch = allRscContent.match(chatMsgPattern);
  if (chatMsgMatch) {
    try {
      const msgs = JSON.parse(chatMsgMatch[1]) as Record<string, unknown>[];
      for (const msg of msgs) {
        const role = msg.sender as string;
        const content = extractTextContent(msg);
        const mappedRole = role === "human" ? "user" : role === "assistant" ? "assistant" : null;
        if (mappedRole && content.trim()) {
          messages.push({ role: mappedRole, content: content.trim() });
        }
      }
    } catch {
      // Continue
    }
  }

  // Also try to find conversation data in RSC component props
  if (messages.length === 0) {
    // Look for text blocks that appear to be user prompts followed by assistant responses
    // Claude share pages embed the rendered messages in specific component structures
    const senderPattern = /"sender"\s*:\s*"(human|assistant)"/g;
    let senderMatch;
    const senderPositions: { role: string; pos: number }[] = [];
    while ((senderMatch = senderPattern.exec(allRscContent)) !== null) {
      senderPositions.push({ role: senderMatch[1], pos: senderMatch.index });
    }

    for (const sp of senderPositions) {
      // Try to extract the content near this sender reference
      const nearby = allRscContent.substring(sp.pos, sp.pos + 50000);
      const contentMatch = nearby.match(/"(?:text|content)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (contentMatch) {
        const text = contentMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
        if (text.trim().length > 5) {
          messages.push({
            role: sp.role === "human" ? "user" : "assistant",
            content: text.trim(),
          });
        }
      }
    }
  }

  return messages;
}

function extractClaudeMessages(data: unknown, messages: ParsedMessage[]): void {
  if (!data || typeof data !== "object") return;
  const obj = data as Record<string, unknown>;

  // Look for chat_messages, messages, conversation arrays
  const possibleKeys = ["chat_messages", "messages", "conversation", "turns"];
  for (const key of possibleKeys) {
    const arr = findNestedArray(obj, key);
    if (arr && arr.length > 0) {
      for (const item of arr as Record<string, unknown>[]) {
        const role = (item.sender || item.role || item.author) as string;
        const content = extractTextContent(item);
        const mappedRole = role === "human" ? "user" : role === "assistant" ? "assistant" : null;
        if (mappedRole && content.trim()) {
          messages.push({ role: mappedRole, content: content.trim() });
        }
      }
      if (messages.length > 0) return;
    }
  }

  // Recursive search for message-like arrays
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
      const first = val[0] as Record<string, unknown>;
      if (first.role || first.sender || first.author) {
        for (const item of val as Record<string, unknown>[]) {
          const role = (item.role || item.sender || item.author) as string;
          const content = extractTextContent(item);
          const mappedRole =
            role === "human" || role === "user" ? "user" :
            role === "assistant" ? "assistant" : null;
          if (mappedRole && content.trim()) {
            messages.push({ role: mappedRole, content: content.trim() });
          }
        }
        if (messages.length > 0) return;
      }
    }
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      extractClaudeMessages(val, messages);
      if (messages.length > 0) return;
    }
  }
}

// ─── Gemini Parser ────────────────────────────────────────────────

/**
 * Parse Gemini's WIZ_global_data.DnVkpd format.
 * Format: prompt SEP1 image_url SEP1 dark_image_url SEP1 response SEP2 prompt2 SEP1 ...
 * SEP1 = ✧ (U+2727) and SEP2 = ░ (U+2591), but encoding may garble them.
 * We detect separators by looking at non-ASCII chars adjacent to URLs.
 */
function parseGeminiDnVkpd(raw: string): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  if (!raw || raw.length < 10) return messages;

  // Try to detect the actual separator characters by finding what's between
  // text and the first gstatic.com URL
  const firstUrlIdx = raw.indexOf("https://www.gstatic.com/lamda/");
  if (firstUrlIdx < 1) return messages;

  // The separator is the character(s) immediately before the URL
  // Walk backwards from the URL to find the separator boundary
  let sepEnd = firstUrlIdx;
  let sepStart = sepEnd - 1;
  while (sepStart >= 0 && raw.charCodeAt(sepStart) > 127) {
    sepStart--;
  }
  sepStart++; // move back to first non-ASCII

  const fieldSep = raw.substring(sepStart, sepEnd);
  if (!fieldSep) return messages;

  // Now split by field separator
  const fields = raw.split(fieldSep);

  // Fields alternate: prompt, url1, url2, response, prompt2, url1, url2, response2, ...
  // But there's also a turn separator between groups
  // Detect turn separator: it's a non-ASCII char(s) at the start of prompt2 that isn't a URL
  const turns: { prompt: string; response: string }[] = [];
  let i = 0;

  while (i < fields.length) {
    let prompt = fields[i] || "";
    // Check if prompt starts with a turn separator (non-ASCII chars)
    // by finding a secondary separator pattern
    const firstAscii = prompt.search(/[\x20-\x7E]/);
    if (firstAscii > 0) {
      prompt = prompt.substring(firstAscii);
    }
    prompt = prompt.trim();

    // Next 2 fields are image URLs (or empty), skip them
    const url1 = fields[i + 1] || "";
    const url2 = fields[i + 2] || "";
    let responseRaw = fields[i + 3] || "";

    // If response ends with turn separator + next prompt, split them
    // The turn separator is non-ASCII chars at the end before the next prompt starts
    const response = responseRaw.trim();

    if (prompt) {
      messages.push({ role: "user", content: prompt });
      if (response) {
        messages.push({ role: "assistant", content: stripHtml(response) });
      }
    }

    i += 4; // move to next group: prompt, url1, url2, response
  }

  return messages;
}

function parseGeminiShare(html: string, _url: string): ParsedSharedChat {
  const messages: ParsedMessage[] = [];
  let title = "Gemini Shared Conversation";

  // Strategy 1: WIZ_global_data.DnVkpd (Gemini embeds share data here)
  const wizMatch = html.match(/window\.WIZ_global_data\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/);
  if (wizMatch) {
    try {
      const wizData = JSON.parse(wizMatch[1]);
      const dnVkpd = wizData["DnVkpd"] as string | undefined;
      if (dnVkpd && dnVkpd.length > 20) {
        const dnMessages = parseGeminiDnVkpd(dnVkpd);
        if (dnMessages.length > 0) {
          messages.push(...dnMessages);
        }
      }
    } catch {
      // Continue to other strategies
    }
  }

  // Strategy 2: React Router turbo-stream (generic fallback)
  if (messages.length === 0) {
    const turboResult = extractFromTurboStream(html);
    if (turboResult && turboResult.messages.length > 0) {
      return {
        platform: "gemini",
        title: turboResult.title || title,
        messages: turboResult.messages,
      };
    }
  }

  // Strategy 3: AF_initDataCallback
  if (messages.length === 0) {
    const wizPattern = /AF_initDataCallback\(\{[^}]*data:\s*([\s\S]*?)\}\s*\)/g;
    let match;
    while ((match = wizPattern.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        extractGeminiFromWiz(data, messages);
        if (messages.length > 0) break;
      } catch {
        continue;
      }
    }
  }

  // Strategy 4: Embedded JSON
  if (messages.length === 0) {
    const jsonScripts = html.matchAll(
      /<script[^>]*(?:type="application\/json"|nonce)[^>]*>([\s\S]*?)<\/script>/g
    );
    for (const m of jsonScripts) {
      try {
        const data = JSON.parse(m[1]);
        extractMessagesFromJson(data, messages);
        if (messages.length > 0) break;
      } catch {
        continue;
      }
    }
  }

  // Strategy 5: Parse HTML structure with Gemini-specific patterns
  if (messages.length === 0) {
    let match;
    const turnPattern =
      /class="[^"]*(?:query-text|user-query|prompt-text)[^"]*"[^>]*>([\s\S]*?)(?=class="[^"]*(?:response-text|model-response|markdown)[^"]*"|class="[^"]*(?:query-text|user-query|prompt-text)[^"]*"|$)/gi;
    const responsePattern =
      /class="[^"]*(?:response-text|model-response|response-container)[^"]*"[^>]*>([\s\S]*?)(?=class="[^"]*(?:query-text|user-query|prompt-text)[^"]*"|class="[^"]*(?:response-text|model-response|response-container)[^"]*"|$)/gi;

    const userTurns: string[] = [];
    const assistantTurns: string[] = [];

    while ((match = turnPattern.exec(html)) !== null) {
      userTurns.push(stripHtml(match[1]));
    }
    while ((match = responsePattern.exec(html)) !== null) {
      assistantTurns.push(stripHtml(match[1]));
    }

    for (let i = 0; i < Math.max(userTurns.length, assistantTurns.length); i++) {
      if (userTurns[i]?.trim()) messages.push({ role: "user", content: userTurns[i].trim() });
      if (assistantTurns[i]?.trim()) messages.push({ role: "assistant", content: assistantTurns[i].trim() });
    }
  }

  // Strategy 6: data attributes  
  if (messages.length === 0) {
    let match;
    const msgPattern =
      /data-(?:message-)?(?:author-)?role="(user|model|assistant)"[^>]*>([\s\S]*?)(?=data-(?:message-)?(?:author-)?role="|$)/gi;
    while ((match = msgPattern.exec(html)) !== null) {
      const role = match[1] === "model" ? "assistant" : "user";
      const content = stripHtml(match[2]);
      if (content.trim()) messages.push({ role, content: content.trim() });
    }
  }

  // Strategy 7: Generic fallback
  if (messages.length === 0) {
    extractFromGenericHtml(html, messages);
  }

  // Detect consent redirect page (Gemini redirects to Google consent)
  if (messages.length === 0 && html.includes("consent.google.com")) {
    throw new Error(
      "Gemini's share page requires cookie consent and cannot be fully accessed from a server. " +
      "Please use the \"Paste Conversation\" tab instead: open the Gemini share link in your browser, " +
      "select all text (Ctrl+A), copy (Ctrl+C), and paste it here."
    );
  }

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const t = titleMatch[1].replace(/\s*[-|]?\s*(?:Google\s*)?Gemini\s*$/i, "").trim();
    if (t && t.length > 2 && !t.includes("direct access to Google")) title = t;
  }

  return { platform: "gemini", title, messages };
}

function extractGeminiFromWiz(data: unknown, messages: ParsedMessage[]): void {
  // Gemini WIZ data is nested arrays - recursively look for conversation pairs
  if (!Array.isArray(data)) return;
  for (const item of data) {
    if (Array.isArray(item)) {
      // Look for [prompt_text, response_text] patterns in deeply nested arrays
      extractGeminiFromWiz(item, messages);
    } else if (typeof item === "string" && item.length > 20) {
      // Could be a message text, but we need context - skip standalone strings
    }
  }
}

// ─── Generic Parser ───────────────────────────────────────────────

function parseGenericShare(html: string): ParsedSharedChat {
  const messages: ParsedMessage[] = [];

  // Try turbo-stream first
  const turboResult = extractFromTurboStream(html);
  if (turboResult && turboResult.messages.length > 0) {
    return {
      platform: "unknown",
      title: turboResult.title || "Shared Conversation",
      messages: turboResult.messages,
    };
  }

  // Try all JSON strategies
  const jsonScripts = html.matchAll(
    /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g
  );
  for (const m of jsonScripts) {
    try {
      const data = JSON.parse(m[1]);
      extractMessagesFromJson(data, messages);
      if (messages.length > 0) break;
    } catch {
      continue;
    }
  }

  if (messages.length === 0) {
    extractFromGenericHtml(html, messages);
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || "Shared Conversation";

  return { platform: "unknown", title, messages };
}

// ─── Shared Helpers ───────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractMessagesFromJson(data: unknown, messages: ParsedMessage[], depth = 0): void {
  if (depth > 10 || !data || typeof data !== "object") return;
  const obj = data as Record<string, unknown>;

  // Look for messages/turns arrays with role/content structure
  for (const [key, val] of Object.entries(obj)) {
    if (
      Array.isArray(val) &&
      val.length > 0 &&
      typeof val[0] === "object" &&
      val[0] !== null
    ) {
      const first = val[0] as Record<string, unknown>;
      if (first.role || first.author || first.sender) {
        for (const item of val as Record<string, unknown>[]) {
          const role = (item.role || (item.author as Record<string, string>)?.role || item.sender) as string;
          const content = extractTextContent(item);
          const mappedRole =
            role === "user" || role === "human" ? "user" :
            role === "assistant" || role === "model" || role === "bot" ? "assistant" : null;
          if (mappedRole && content.trim()) {
            messages.push({ role: mappedRole, content: content.trim() });
          }
        }
        if (messages.length > 0) return;
      }
    }

    // Check for mapping objects (ChatGPT style)
    if (key === "mapping" && typeof val === "object" && val !== null && !Array.isArray(val)) {
      for (const node of Object.values(val as Record<string, unknown>)) {
        const nodeObj = node as Record<string, unknown>;
        const msg = nodeObj?.message as Record<string, unknown>;
        if (!msg) continue;
        const author = msg.author as Record<string, string>;
        const role = author?.role;
        const contentObj = msg.content as Record<string, unknown>;
        const parts = contentObj?.parts as unknown[];
        if (parts && (role === "user" || role === "assistant")) {
          const text = parts.filter(p => typeof p === "string").join("\n");
          if (text.trim()) messages.push({ role, content: text.trim() });
        }
      }
      if (messages.length > 0) return;
    }

    // Recurse into objects
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      extractMessagesFromJson(val, messages, depth + 1);
      if (messages.length > 0) return;
    }
  }
}

function extractTextContent(item: Record<string, unknown>): string {
  // Try various content field patterns
  if (typeof item.content === "string") return item.content;
  if (typeof item.text === "string") return item.text;
  if (typeof item.body === "string") return item.body;

  const contentObj = item.content as Record<string, unknown> | undefined;
  if (contentObj) {
    if (typeof contentObj.text === "string") return contentObj.text;
    if (Array.isArray(contentObj.parts)) {
      return contentObj.parts.filter(p => typeof p === "string").join("\n");
    }
    if (typeof contentObj.value === "string") return contentObj.value;
  }

  // Try nested content array (Claude style)
  if (Array.isArray(item.content)) {
    return (item.content as Record<string, unknown>[])
      .map(c => {
        if (typeof c === "string") return c;
        if (typeof c.text === "string") return c.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function extractTitle(data: unknown, depth = 0): string | null {
  if (depth > 5 || !data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.title === "string" && obj.title.length > 0) return obj.title;
  if (typeof obj.name === "string" && obj.name.length > 0) return obj.name;
  for (const val of Object.values(obj)) {
    if (typeof val === "object" && val !== null) {
      const found = extractTitle(val, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function findNestedArray(obj: Record<string, unknown>, key: string): unknown[] | null {
  if (Array.isArray(obj[key])) return obj[key] as unknown[];
  for (const val of Object.values(obj)) {
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      const found = findNestedArray(val as Record<string, unknown>, key);
      if (found) return found;
    }
  }
  return null;
}

function parseHtmlMessages(
  html: string,
  messages: ParsedMessage[],
  config: {
    userSelectors: RegExp[];
    assistantSelectors: RegExp[];
    turnSelector: RegExp;
  }
): void {
  const { turnSelector } = config;
  let match;
  const turns: { role: "user" | "assistant"; pos: number }[] = [];

  while ((match = turnSelector.exec(html)) !== null) {
    turns.push({
      role: match[1] as "user" | "assistant",
      pos: match.index,
    });
  }

  for (let i = 0; i < turns.length; i++) {
    const start = turns[i].pos;
    const end = i + 1 < turns.length ? turns[i + 1].pos : html.length;
    const segment = html.substring(start, end);
    const content = stripHtml(segment);
    if (content.trim().length > 5) {
      messages.push({ role: turns[i].role, content: content.trim() });
    }
  }
}

function extractFromGenericHtml(html: string, messages: ParsedMessage[]): void {
  // Try to find any alternating pattern in the HTML
  // Look for common conversation div patterns
  const patterns = [
    /data-message-author-role="(user|assistant|human|model)"[^>]*>([\s\S]*?)(?=data-message-author-role="|$)/gi,
    /class="[^"]*\b(user|assistant|human|model)-(?:message|turn|content)[^"]*"[^>]*>([\s\S]*?)(?=class="[^"]*\b(?:user|assistant|human|model)-(?:message|turn|content)|$)/gi,
    /role="(user|assistant|human|model)"[^>]*>([\s\S]*?)(?=role="(?:user|assistant|human|model)"|$)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const rawRole = match[1].toLowerCase();
      const role: "user" | "assistant" =
        rawRole === "user" || rawRole === "human" ? "user" : "assistant";
      const content = stripHtml(match[2]);
      if (content.trim().length > 5) {
        messages.push({ role, content: content.trim() });
      }
    }
    if (messages.length > 0) return;
  }
}

// ─── Convert to Journey Steps ─────────────────────────────────────

export function messagesToSteps(chat: ParsedSharedChat): {
  title: string;
  description: string;
  steps: JourneyStep[];
  platform: string;
} {
  const steps: JourneyStep[] = [];
  let stepNum = 0;

  for (let i = 0; i < chat.messages.length; i++) {
    const msg = chat.messages[i];
    if (msg.role === "user") {
      stepNum++;
      const response =
        i + 1 < chat.messages.length && chat.messages[i + 1].role === "assistant"
          ? chat.messages[i + 1].content
          : "";
      if (response) i++;

      steps.push({
        id: String(Date.now() + stepNum),
        title: `Step ${stepNum}: ${msg.content.substring(0, 60)}${msg.content.length > 60 ? "..." : ""}`,
        prompt: msg.content,
        result: response,
        notes: "",
      });
    }
  }

  const platformLabels: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    unknown: "AI",
  };

  return {
    title: chat.title,
    description: `Imported from ${platformLabels[chat.platform]} shared link with ${steps.length} steps.`,
    steps,
    platform: chat.platform,
  };
}
