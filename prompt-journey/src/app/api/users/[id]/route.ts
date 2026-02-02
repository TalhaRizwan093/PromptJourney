import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// GET user profile
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            journeys: { where: { published: true } },
            oneShots: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's journeys
    const journeys = await db.journey.findMany({
      where: { authorId: id, published: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: { select: { comments: true } },
        awards: true,
      },
    });

    // Calculate total votes received
    const totalVotes = await db.journey.aggregate({
      where: { authorId: id },
      _sum: { voteCount: true },
    });

    return NextResponse.json({
      ...user,
      journeyCount: user._count.journeys,
      oneShotCount: user._count.oneShots,
      totalVotes: totalVotes._sum.voteCount || 0,
      journeys: journeys.map((j) => ({
        ...j,
        commentCount: j._count.comments,
        award: j.awards[0] || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PUT update profile
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
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, bio } = body;

    const user = await db.user.update({
      where: { id },
      data: { name, bio },
      select: { id: true, name: true, bio: true, image: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
