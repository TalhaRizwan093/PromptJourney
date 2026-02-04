import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";

const journeySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  content: z.string(), // JSON string with steps
  tags: z.string(),
  published: z.boolean().default(false),
});

// GET all journeys with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "hot"; // hot, new, top
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { published: true };
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    
    if (tag) {
      where.tags = { contains: tag };
    }

    let orderBy: Record<string, string> = {};
    switch (sort) {
      case "new":
        orderBy = { createdAt: "desc" };
        break;
      case "top":
        orderBy = { voteCount: "desc" };
        break;
      case "hot":
      default:
        orderBy = { voteCount: "desc" }; // Could add time decay later
        break;
    }

    const [journeys, total] = await Promise.all([
      db.journey.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true } },
          awards: true,
        },
      }),
      db.journey.count({ where }),
    ]);

    type JourneyWithRelations = typeof journeys[number];
    return NextResponse.json({
      journeys: journeys.map((j: JourneyWithRelations) => ({
        ...j,
        commentCount: j._count.comments,
        award: j.awards[0] || null,
      })),
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching journeys:", error);
    return NextResponse.json({ error: "Failed to fetch journeys" }, { status: 500 });
  }
}

// POST create new journey
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = journeySchema.parse(body);

    const journey = await db.journey.create({
      data: {
        ...data,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(journey, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error creating journey:", error);
    return NextResponse.json({ error: "Failed to create journey" }, { status: 500 });
  }
}
