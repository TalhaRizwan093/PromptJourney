/**
 * ChatGPT HTML Export Parser
 * Parses the chat.html file from ChatGPT data export into journey steps.
 */

export interface ParsedMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ParsedConversation {
  title: string;
  messages: ParsedMessage[];
  createdAt?: string;
}

export interface JourneyStep {
  id: string;
  title: string;
  prompt: string;
  result: string;
  notes: string;
}

/**
 * Parse ChatGPT exported HTML into conversations.
 * ChatGPT export contains a chat.html with conversation data.
 */
export function parseChatGPTHtml(html: string): ParsedConversation[] {
  const conversations: ParsedConversation[] = [];

  // ChatGPT exports contain conversations in <div> blocks with role markers.
  // The format varies but typically has alternating user/assistant messages.
  // We use regex-based parsing since we're server-side (no DOM).

  // Try to extract JSON data if embedded in script tags (newer exports)
  const jsonMatch = html.match(
    /<script[^>]*>\s*(?:var\s+\w+\s*=\s*)?([\[\{][\s\S]*?[\]\}])\s*;?\s*<\/script>/
  );
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (Array.isArray(data)) {
        return data.map(parseJsonConversation).filter(Boolean) as ParsedConversation[];
      }
    } catch {
      // Fall through to HTML parsing
    }
  }

  // Parse HTML structure - ChatGPT exports have conversation blocks
  // Split by conversation boundaries
  const convBlocks = html.split(
    /(?:<h[1-4][^>]*>|<div[^>]*class="[^"]*conversation[^"]*"[^>]*>)/i
  );

  for (const block of convBlocks) {
    if (!block.trim()) continue;

    // Extract title from first heading-like content
    const titleMatch = block.match(
      /^([^<]+)|<[^>]*>([^<]{3,100})/
    );
    const title = cleanHtml(titleMatch?.[1] || titleMatch?.[2] || "Untitled Conversation");

    const messages: ParsedMessage[] = [];

    // Match user and assistant message patterns
    // Pattern 1: role-based divs
    const rolePattern =
      /(?:class="[^"]*(?:user|human|author)[^"]*"|(?:You|User|Human)\s*:)\s*(?:<[^>]*>)*([\s\S]*?)(?=(?:class="[^"]*(?:assistant|ai|chatgpt|gpt)[^"]*"|(?:ChatGPT|Assistant|AI)\s*:)|$)/gi;
    const assistantPattern =
      /(?:class="[^"]*(?:assistant|ai|chatgpt|gpt)[^"]*"|(?:ChatGPT|Assistant|AI)\s*:)\s*(?:<[^>]*>)*([\s\S]*?)(?=(?:class="[^"]*(?:user|human|author)[^"]*"|(?:You|User|Human)\s*:)|$)/gi;

    // Simpler approach: find all message-like blocks
    const msgPattern =
      /(?:<div[^>]*class="[^"]*message[^"]*"[^>]*>|(?:^|\n)(?:(?:User|You|Human|ChatGPT|Assistant|AI|GPT)\s*[:]\s*))([\s\S]*?)(?=(?:<div[^>]*class="[^"]*message[^"]*"|(?:\n)(?:User|You|Human|ChatGPT|Assistant|AI|GPT)\s*[:])|\s*$)/gi;

    let match;
    let isUser = true;

    while ((match = msgPattern.exec(block)) !== null) {
      const content = cleanHtml(match[1] || match[0]);
      if (content.length > 5) {
        messages.push({
          role: isUser ? "user" : "assistant",
          content: content.trim(),
        });
        isUser = !isUser;
      }
    }

    // If regex didn't work well, try line-by-line parsing
    if (messages.length === 0) {
      const lines = block.split(/\n/);
      let currentRole: "user" | "assistant" = "user";
      let currentContent = "";

      for (const line of lines) {
        const cleaned = cleanHtml(line).trim();
        if (!cleaned) continue;

        const userMatch = cleaned.match(/^(?:User|You|Human)\s*:\s*(.*)/i);
        const assistantMatch = cleaned.match(
          /^(?:ChatGPT|Assistant|AI|GPT(?:-\d)?)\s*:\s*(.*)/i
        );

        if (userMatch) {
          if (currentContent) {
            messages.push({ role: currentRole, content: currentContent.trim() });
          }
          currentRole = "user";
          currentContent = userMatch[1];
        } else if (assistantMatch) {
          if (currentContent) {
            messages.push({ role: currentRole, content: currentContent.trim() });
          }
          currentRole = "assistant";
          currentContent = assistantMatch[1];
        } else {
          currentContent += "\n" + cleaned;
        }
      }

      if (currentContent.trim()) {
        messages.push({ role: currentRole, content: currentContent.trim() });
      }
    }

    if (messages.length >= 2) {
      conversations.push({ title: title.substring(0, 200), messages });
    }
  }

  return conversations;
}

/**
 * Parse a JSON conversation object (from newer ChatGPT exports).
 */
function parseJsonConversation(conv: Record<string, unknown>): ParsedConversation | null {
  try {
    const title = (conv.title as string) || "Untitled";
    const messages: ParsedMessage[] = [];
    const mapping = conv.mapping as Record<string, Record<string, unknown>> | undefined;

    if (mapping) {
      // Newer format with mapping object
      for (const node of Object.values(mapping)) {
        const msg = node.message as Record<string, unknown> | undefined;
        if (!msg) continue;
        const author = msg.author as Record<string, string> | undefined;
        const role = author?.role;
        const content = msg.content as Record<string, unknown> | undefined;
        const parts = content?.parts as string[] | undefined;

        if (role && parts && (role === "user" || role === "assistant")) {
          const text = parts.filter((p) => typeof p === "string").join("\n");
          if (text.trim()) {
            messages.push({ role, content: text });
          }
        }
      }
    }

    if (messages.length >= 2) {
      return { title, messages, createdAt: conv.create_time as string };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Convert parsed conversations into journey steps.
 */
export function conversationsToSteps(conversations: ParsedConversation[]): {
  title: string;
  steps: JourneyStep[];
} {
  // If multiple conversations, use the first one (user picks on frontend)
  const conv = conversations[0];
  if (!conv) {
    return { title: "Imported Journey", steps: [] };
  }

  const steps: JourneyStep[] = [];
  let stepCount = 0;

  // Pair user messages with assistant responses
  for (let i = 0; i < conv.messages.length; i++) {
    const msg = conv.messages[i];
    if (msg.role === "user") {
      stepCount++;
      const response = conv.messages[i + 1];
      steps.push({
        id: String(Date.now() + stepCount),
        title: `Step ${stepCount}: ${msg.content.substring(0, 60)}${msg.content.length > 60 ? "..." : ""}`,
        prompt: msg.content,
        result: response?.role === "assistant" ? response.content : "",
        notes: "",
      });
      if (response?.role === "assistant") i++; // skip the response
    }
  }

  return { title: conv.title, steps };
}

/** Strip HTML tags and decode entities */
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
