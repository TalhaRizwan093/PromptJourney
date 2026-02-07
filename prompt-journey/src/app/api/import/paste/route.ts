import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { parseConversation } from "@/lib/parsers/smart-paste-parser";
import { z } from "zod";

const pasteSchema = z.object({
  text: z.string().min(20, "Please paste at least 20 characters of conversation"),
});

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text } = pasteSchema.parse(body);

    // 500KB text limit
    if (text.length > 500_000) {
      return NextResponse.json(
        { error: "Text too long. Maximum 500KB allowed." },
        { status: 400 }
      );
    }

    const result = parseConversation(text);

    if (result.steps.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not detect conversation structure. Try using the format:\nUser: your prompt\nAssistant: the response",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Paste parser error:", error);
    return NextResponse.json(
      { error: "Failed to parse conversation" },
      { status: 500 }
    );
  }
}
