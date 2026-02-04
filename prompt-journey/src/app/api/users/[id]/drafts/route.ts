import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch unpublished/draft journeys for this user
    // For now, we don't have a draft status field in the schema,
    // so this returns empty. Future enhancement: add 'published' boolean to Journey model
    const drafts = await db.journey.findMany({
      where: { 
        authorId: id,
        // Future: add published: false filter when schema is updated
      },
      take: 0, // Return empty for now until draft feature is implemented
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error("Error fetching user drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}
