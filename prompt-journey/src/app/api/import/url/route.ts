import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import {
  detectPlatformFromUrl,
  isValidShareUrl,
  fetchAndParseSharedChat,
  messagesToSteps,
} from "@/lib/parsers/url-share-parser";
import { z } from "zod";

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { url } = urlSchema.parse(body);

    // Validate it's a supported share URL
    if (!isValidShareUrl(url)) {
      const platform = detectPlatformFromUrl(url);
      if (platform === "unknown") {
        return NextResponse.json(
          {
            error:
              "Unsupported URL. Please paste a shared conversation link from ChatGPT, Claude, or Gemini.\n\nSupported formats:\n• https://chatgpt.com/share/...\n• https://claude.ai/share/...\n• https://gemini.google.com/share/...",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "This doesn't look like a share link. Make sure the URL contains '/share/'." },
        { status: 400 }
      );
    }

    // Fetch and parse the shared chat
    const chat = await fetchAndParseSharedChat(url);

    if (chat.messages.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract messages from this link. The conversation may be empty, deleted, or the page structure has changed.\n\nTip: Try copy-pasting the conversation text directly using the 'Paste Conversation' tab instead.",
        },
        { status: 400 }
      );
    }

    // Convert to journey steps
    const result = messagesToSteps(chat);

    if (result.steps.length === 0) {
      return NextResponse.json(
        { error: "No prompt-response pairs found in the conversation." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...result,
      source: `${chat.platform}-share-url`,
      confidence: 0.9,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to import from URL";

    // Check for common fetch errors
    if (message.includes("Failed to fetch") || message.includes("HTTP")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("URL import error:", error);
    return NextResponse.json(
      { error: "Failed to parse the shared conversation. Please try the copy-paste method instead." },
      { status: 500 }
    );
  }
}
