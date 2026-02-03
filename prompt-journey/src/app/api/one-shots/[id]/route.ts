import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

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

    const oneShot = await db.oneShot.findUnique({ where: { id } });
    if (!oneShot) {
      return NextResponse.json({ error: "One-shot not found" }, { status: 404 });
    }
    if (oneShot.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.oneShot.delete({ where: { id } });

    return NextResponse.json({ message: "One-shot deleted" });
  } catch (error) {
    console.error("Error deleting one-shot:", error);
    return NextResponse.json(
      { error: "Failed to delete one-shot" },
      { status: 500 }
    );
  }
}
