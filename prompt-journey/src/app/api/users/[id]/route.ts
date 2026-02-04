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
    const session = await getAuthSession();

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        isPublic: true,
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

    // Check if profile is private and viewer is not the owner
    const isOwner = session?.user?.id === id;
    if (!user.isPublic && !isOwner) {
      return NextResponse.json({
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        isPublic: false,
        isPrivate: true,
        journeyCount: 0,
        oneShotCount: 0,
        totalVotes: 0,
        journeys: [],
      });
    }

    // Get user's journeys
    const journeys = await db.journey.findMany({
      where: { authorId: id, published: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true } },
        awards: true,
      },
    });

    // Calculate total votes received
    const totalVotes = await db.journey.aggregate({
      where: { authorId: id },
      _sum: { voteCount: true },
    });

    type JourneyWithRelations = typeof journeys[number];
    return NextResponse.json({
      ...user,
      journeyCount: user._count.journeys,
      oneShotCount: user._count.oneShots,
      totalVotes: totalVotes._sum.voteCount || 0,
      journeys: journeys.map((j: JourneyWithRelations) => ({
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
    const { name, bio, isPublic } = body;

    const updateData: { name?: string; bio?: string; isPublic?: boolean } = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, bio: true, image: true, isPublic: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE user account
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
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete all user data (cascading deletes handled by Prisma)
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
