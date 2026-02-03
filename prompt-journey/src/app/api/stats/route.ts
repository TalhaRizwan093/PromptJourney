import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET site-wide statistics
export async function GET() {
  try {
    const [journeyCount, userCount, oneShotCount] = await Promise.all([
      db.journey.count({ where: { published: true } }),
      db.user.count(),
      db.oneShot.count(),
    ]);

    return NextResponse.json({
      journeys: journeyCount,
      users: userCount,
      oneShots: oneShotCount,
      prompts: oneShotCount + journeyCount, // Total prompts shared
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
