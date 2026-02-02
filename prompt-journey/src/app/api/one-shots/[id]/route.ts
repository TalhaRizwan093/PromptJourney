import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const oneShot = await db.oneShot.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    if (!oneShot) {
      return NextResponse.json({ error: "One-shot not found" }, { status: 404 });
    }

    return NextResponse.json(oneShot);
  } catch (error) {
    console.error("Error fetching one-shot:", error);
    return NextResponse.json(
      { error: "Failed to fetch one-shot" },
      { status: 500 }
    );
  }
}
