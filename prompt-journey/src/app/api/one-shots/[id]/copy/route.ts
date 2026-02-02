import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST increment copy count
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const oneShot = await db.oneShot.update({
      where: { id },
      data: { copyCount: { increment: 1 } },
      select: { copyCount: true },
    });

    return NextResponse.json({ copyCount: oneShot.copyCount });
  } catch (error) {
    console.error("Error incrementing copy count:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
