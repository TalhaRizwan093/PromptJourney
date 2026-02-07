/**
 * Smart Paste Parser
 * Auto-detects conversation format (ChatGPT, Claude, Copilot, generic)
 * and structures it into journey steps.
 */

export interface JourneyStep {
  id: string;
  title: string;
  prompt: string;
  result: string;
  notes: string;
}

type Platform = "chatgpt" | "claude" | "copilot" | "gemini" | "generic";

interface DetectionResult {
  platform: Platform;
  confidence: number;
}

/**
 * Detect which AI platform the conversation came from.
 */
export function detectPlatform(text: string): DetectionResult {
  const lower = text.toLowerCase();
  const scores: Record<Platform, number> = {
    chatgpt: 0,
    claude: 0,
    copilot: 0,
    gemini: 0,
    generic: 0,
  };

  // ChatGPT indicators
  if (/chatgpt|openai/i.test(lower)) scores.chatgpt += 3;
  if (/^you:\s/im.test(text) || /^user:\s/im.test(text)) scores.chatgpt += 2;
  if (/^chatgpt:\s/im.test(text)) scores.chatgpt += 4;
  if (/^gpt-?[34o](?:\.\d)?/im.test(text)) scores.chatgpt += 3;

  // Claude indicators
  if (/claude|anthropic/i.test(lower)) scores.claude += 3;
  if (/^human:\s/im.test(text)) scores.claude += 4;
  if (/^assistant:\s/im.test(text)) scores.claude += 3;
  if (/\[H\]|\[A\]/m.test(text)) scores.claude += 2;

  // Copilot indicators
  if (/copilot|github\s*copilot/i.test(lower)) scores.copilot += 4;
  if (/^@workspace|^\/explain|^\/fix|^\/tests/m.test(text)) scores.copilot += 3;

  // Gemini indicators
  if (/gemini|bard|google\s*ai/i.test(lower)) scores.gemini += 3;
  if (/^model:\s/im.test(text)) scores.gemini += 2;

  // Generic patterns (fallback)
  scores.generic = 1;

  const best = Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a));
  return {
    platform: best[0] as Platform,
    confidence: Math.min(best[1] / 5, 1),
  };
}

/**
 * Define role markers per platform.
 */
const ROLE_PATTERNS: Record<Platform, { user: RegExp; assistant: RegExp }> = {
  chatgpt: {
    user: /^(?:You|User|Human|Me)\s*:\s*/im,
    assistant: /^(?:ChatGPT|Assistant|GPT(?:-?[34o](?:\.\d)?)?|AI)\s*:\s*/im,
  },
  claude: {
    user: /^(?:Human|H|You|User)\s*[:\]]\s*/im,
    assistant: /^(?:Assistant|A|Claude)\s*[:\]]\s*/im,
  },
  copilot: {
    user: /^(?:User|You|Me|>\s*)\s*:\s*/im,
    assistant: /^(?:Copilot|GitHub Copilot|Assistant)\s*:\s*/im,
  },
  gemini: {
    user: /^(?:You|User|Human)\s*:\s*/im,
    assistant: /^(?:Gemini|Bard|Model|Google\s*AI)\s*:\s*/im,
  },
  generic: {
    user: /^(?:User|You|Human|Me|Q|Question|Prompt)\s*[:\]]\s*/im,
    assistant: /^(?:Assistant|AI|Bot|Answer|Response|A|Model)\s*[:\]]\s*/im,
  },
};

/**
 * Parse pasted conversation text into structured journey steps.
 */
export function parseConversation(text: string): {
  platform: Platform;
  confidence: number;
  title: string;
  description: string;
  steps: JourneyStep[];
} {
  const { platform, confidence } = detectPlatform(text);
  const patterns = ROLE_PATTERNS[platform];

  // Build a combined pattern to split on role markers
  const combinedPattern = new RegExp(
    `(${patterns.user.source}|${patterns.assistant.source})`,
    "gim"
  );

  const parts = text.split(combinedPattern).filter((p) => p.trim());

  const messages: { role: "user" | "assistant"; content: string }[] = [];
  let currentRole: "user" | "assistant" | null = null;

  for (const part of parts) {
    if (patterns.user.test(part)) {
      currentRole = "user";
    } else if (patterns.assistant.test(part)) {
      currentRole = "assistant";
    } else if (currentRole) {
      messages.push({ role: currentRole, content: part.trim() });
      currentRole = null;
    }
  }

  // If no structured messages found, try splitting by double newlines
  // and alternating user/assistant
  if (messages.length < 2) {
    return parseUnstructured(text, platform, confidence);
  }

  // Convert to journey steps
  const steps: JourneyStep[] = [];
  let stepNum = 0;

  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "user") {
      stepNum++;
      const prompt = messages[i].content;
      const result =
        i + 1 < messages.length && messages[i + 1].role === "assistant"
          ? messages[i + 1].content
          : "";
      if (result) i++;

      steps.push({
        id: String(Date.now() + stepNum),
        title: `Step ${stepNum}: ${prompt.substring(0, 60)}${prompt.length > 60 ? "..." : ""}`,
        prompt,
        result,
        notes: "",
      });
    }
  }

  // Generate title from first prompt
  const title = steps[0]
    ? `${platformLabel(platform)} Conversation: ${steps[0].prompt.substring(0, 80)}...`
    : `Imported ${platformLabel(platform)} Conversation`;

  const description = `Imported from ${platformLabel(platform)} conversation with ${steps.length} steps.`;

  return { platform, confidence, title: title.substring(0, 200), description, steps };
}

/**
 * Fallback parser for unstructured text (no clear role markers).
 * Splits by blank lines and alternates user/assistant.
 */
function parseUnstructured(
  text: string,
  platform: Platform,
  confidence: number
) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 10);

  const steps: JourneyStep[] = [];
  let stepNum = 0;

  for (let i = 0; i < blocks.length; i += 2) {
    stepNum++;
    steps.push({
      id: String(Date.now() + stepNum),
      title: `Step ${stepNum}`,
      prompt: blocks[i],
      result: blocks[i + 1] || "",
      notes: "",
    });
  }

  return {
    platform,
    confidence: Math.max(confidence - 0.3, 0),
    title: `Imported Conversation (${steps.length} steps)`,
    description: `Auto-parsed conversation with ${steps.length} prompt-response pairs.`,
    steps,
  };
}

function platformLabel(p: Platform): string {
  const labels: Record<Platform, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    copilot: "Copilot",
    gemini: "Gemini",
    generic: "AI",
  };
  return labels[p];
}
