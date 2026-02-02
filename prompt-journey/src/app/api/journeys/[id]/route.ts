import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// GET single journey
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const journey = await db.journey.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, image: true, bio: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, image: true } },
            replies: {
              include: {
                author: { select: { id: true, name: true, image: true } },
              },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: "desc" },
        },
        awards: true,
        _count: { select: { comments: true } },
      },
    });

    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    // Increment view count
    await db.journey.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Check if current user has voted
    const session = await getAuthSession();
    let userVote = null;
    if (session?.user) {
      const vote = await db.vote.findUnique({
        where: { userId_journeyId: { userId: session.user.id, journeyId: id } },
      });
      userVote = vote?.value || null;
    }

    return NextResponse.json({
      ...journey,
      commentCount: journey._count.comments,
      award: journey.awards[0] || null,
      userVote,
    });
  } catch (error) {
    console.error("Error fetching journey:", error);
    return NextResponse.json({ error: "Failed to fetch journey" }, { status: 500 });
  }
}

// PUT update journey
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const journey = await db.journey.findUnique({ where: { id } });
    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }
    if (journey.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.journey.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating journey:", error);
    return NextResponse.json({ error: "Failed to update journey" }, { status: 500 });
  }
}

// DELETE journey
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const journey = await db.journey.findUnique({ where: { id } });
    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }
    if (journey.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.journey.delete({ where: { id } });

    return NextResponse.json({ message: "Journey deleted" });
  } catch (error) {
    console.error("Error deleting journey:", error);
    return NextResponse.json({ error: "Failed to delete journey" }, { status: 500 });
  }
}
