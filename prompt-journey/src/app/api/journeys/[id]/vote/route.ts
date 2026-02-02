import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";

const voteSchema = z.object({
  value: z.number().refine((v) => v === 1 || v === -1, "Value must be 1 or -1"),
});

// POST vote on a journey
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: journeyId } = await params;
    const body = await req.json();
    const { value } = voteSchema.parse(body);

    const journey = await db.journey.findUnique({ where: { id: journeyId } });
    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    const existingVote = await db.vote.findUnique({
      where: { userId_journeyId: { userId: session.user.id, journeyId } },
    });

    let voteChange: number = value;

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote if same value
        await db.vote.delete({
          where: { userId_journeyId: { userId: session.user.id, journeyId } },
        });
        voteChange = -value;
      } else {
        // Update vote
        await db.vote.update({
          where: { userId_journeyId: { userId: session.user.id, journeyId } },
          data: { value },
        });
        voteChange = value * 2; // From -1 to 1 or 1 to -1
      }
    } else {
      // Create new vote
      await db.vote.create({
        data: { userId: session.user.id, journeyId, value },
      });
    }

    // Update journey vote count
    const updatedJourney = await db.journey.update({
      where: { id: journeyId },
      data: { voteCount: { increment: voteChange } },
      select: { voteCount: true },
    });

    return NextResponse.json({
      voteCount: updatedJourney.voteCount,
      userVote: existingVote?.value === value ? null : value,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Error voting:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
