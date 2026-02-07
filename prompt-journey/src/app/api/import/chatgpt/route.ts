import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import {
  parseChatGPTHtml,
  conversationsToSteps,
} from "@/lib/parsers/chatgpt-html-parser";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (
      !file.name.endsWith(".html") &&
      !file.name.endsWith(".htm") &&
      !file.name.endsWith(".json")
    ) {
      return NextResponse.json(
        { error: "Please upload an HTML or JSON file from ChatGPT export" },
        { status: 400 }
      );
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum 10MB allowed." },
        { status: 400 }
      );
    }

    const content = await file.text();

    // If JSON file, try parsing directly
    if (file.name.endsWith(".json")) {
      try {
        const jsonData = JSON.parse(content);
        const conversations = Array.isArray(jsonData) ? jsonData : [jsonData];
        const allResults = conversations
          .map((conv: Record<string, unknown>) => {
            const title = (conv.title as string) || "Untitled";
            const mapping = conv.mapping as Record<
              string,
              Record<string, unknown>
            >;
            const messages: { role: "user" | "assistant"; content: string }[] =
              [];

            if (mapping) {
              for (const node of Object.values(mapping)) {
                const msg = node.message as Record<string, unknown> | undefined;
                if (!msg) continue;
                const author = msg.author as Record<string, string>;
                const role = author?.role;
                const contentObj = msg.content as Record<string, unknown>;
                const parts = contentObj?.parts as string[];
                if (
                  parts &&
                  (role === "user" || role === "assistant")
                ) {
                  const text = parts
                    .filter((p) => typeof p === "string")
                    .join("\n");
                  if (text.trim()) messages.push({ role, content: text });
                }
              }
            }
            return { title, messages };
          })
          .filter(
            (c: { messages: unknown[] }) => c.messages.length >= 2
          );

        return NextResponse.json({
          conversations: allResults.map(
            (conv: {
              title: string;
              messages: { role: string; content: string }[];
            }) => ({
              title: conv.title,
              messageCount: conv.messages.length,
            })
          ),
          // Convert first conversation to steps for quick use
          ...conversationsToSteps(
            allResults.map(
              (c: {
                title: string;
                messages: { role: string; content: string }[];
              }) => ({
                title: c.title,
                messages: c.messages as {
                  role: "user" | "assistant" | "system";
                  content: string;
                }[],
              })
            )
          ),
          source: "chatgpt-json",
        });
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON file format" },
          { status: 400 }
        );
      }
    }

    // Parse HTML
    const conversations = parseChatGPTHtml(content);

    if (conversations.length === 0) {
      return NextResponse.json(
        {
          error:
            "No conversations found in the uploaded file. Make sure this is a ChatGPT export file.",
        },
        { status: 400 }
      );
    }

    const result = conversationsToSteps(conversations);

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        title: c.title,
        messageCount: c.messages.length,
      })),
      ...result,
      source: "chatgpt-html",
    });
  } catch (error) {
    console.error("ChatGPT import error:", error);
    return NextResponse.json(
      { error: "Failed to parse the file" },
      { status: 500 }
    );
  }
}
