import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";

const oneShotSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  result: z.string().optional(),
  category: z.string(),
});

// GET all one-shots
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    
    if (category && category !== "All") {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { prompt: { contains: search } },
      ];
    }

    const oneShots = await db.oneShot.findMany({
      where,
      orderBy: { copyCount: "desc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(oneShots);
  } catch (error) {
    console.error("Error fetching one-shots:", error);
    return NextResponse.json({ error: "Failed to fetch one-shots" }, { status: 500 });
  }
}

// POST create one-shot
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = oneShotSchema.parse(body);

    const oneShot = await db.oneShot.create({
      data: {
        ...data,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(oneShot, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating one-shot:", error);
    return NextResponse.json({ error: "Failed to create one-shot" }, { status: 500 });
  }
}
