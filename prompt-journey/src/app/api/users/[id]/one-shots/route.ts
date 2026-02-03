import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const oneShots = await db.oneShot.findMany({
      where: { authorId: id },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ oneShots });
  } catch (error) {
    console.error("Error fetching user one-shots:", error);
    return NextResponse.json(
      { error: "Failed to fetch one-shots" },
      { status: 500 }
    );
  }
}
