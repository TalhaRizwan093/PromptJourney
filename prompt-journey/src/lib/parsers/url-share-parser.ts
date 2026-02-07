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
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
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

// ─── ChatGPT Parser ───────────────────────────────────────────────

function parseChatGPTShare(html: string, _url: string): ParsedSharedChat {
  const messages: ParsedMessage[] = [];
  let title = "ChatGPT Shared Conversation";

  // Strategy 1: Parse __NEXT_DATA__ JSON (most reliable)
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

  // Strategy 2: Parse JSON-LD or other embedded JSON
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

  // Strategy 3: Parse HTML structure
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

  // Strategy 4: Look for alternating divs with specific patterns
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

  // Strategy 5: Generic text extraction as last resort
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

  // Strategy 1: Look for embedded JSON data (Nuxt/SvelteKit/Next)
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

  // Strategy 2: Parse HTML structure with Claude-specific selectors
  if (messages.length === 0) {
    // Claude share pages typically have user/assistant turn divs
    const turnPattern =
      /class="[^"]*(?:human|user)-turn[^"]*"[^>]*>([\s\S]*?)(?=class="[^"]*(?:assistant|ai)-turn|class="[^"]*(?:human|user)-turn|$)/gi;
    const assistantPattern =
      /class="[^"]*(?:assistant|ai)-turn[^"]*"[^>]*>([\s\S]*?)(?=class="[^"]*(?:human|user)-turn|class="[^"]*(?:assistant|ai)-turn|$)/gi;

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

  // Strategy 3: Look for data-role or role attributes
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

  // Strategy 4: Generic fallback
  if (messages.length === 0) {
    extractFromGenericHtml(html, messages);
  }

  // Title from page
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && title === "Claude Shared Conversation") {
    const t = titleMatch[1].replace(/\s*[-|]?\s*Claude\s*$/i, "").trim();
    if (t && t.length > 2) title = t;
  }

  return { platform: "claude", title, messages };
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

function parseGeminiShare(html: string, _url: string): ParsedSharedChat {
  const messages: ParsedMessage[] = [];
  let title = "Gemini Shared Conversation";

  // Strategy 1: Look for embedded data in script tags (WIZ data or AF_initDataCallback)
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

  // Strategy 2: Embedded JSON
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

  // Strategy 3: Parse HTML structure with Gemini-specific patterns
  if (messages.length === 0) {
    // Gemini uses message-content divs with model/user markers
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

  // Strategy 4: Look for data attributes  
  if (messages.length === 0) {
    const msgPattern =
      /data-(?:message-)?(?:author-)?role="(user|model|assistant)"[^>]*>([\s\S]*?)(?=data-(?:message-)?(?:author-)?role="|$)/gi;
    while ((match = msgPattern.exec(html)) !== null) {
      const role = match[1] === "model" ? "assistant" : "user";
      const content = stripHtml(match[2]);
      if (content.trim()) messages.push({ role, content: content.trim() });
    }
  }

  // Strategy 5: Generic fallback
  if (messages.length === 0) {
    extractFromGenericHtml(html, messages);
  }

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const t = titleMatch[1].replace(/\s*[-|]?\s*(?:Google\s*)?Gemini\s*$/i, "").trim();
    if (t && t.length > 2) title = t;
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
