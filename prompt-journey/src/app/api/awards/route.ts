import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET awards - daily, weekly, monthly winners
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // daily, weekly, monthly, all

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekNum = getWeekNumber(now);
    const month = now.toISOString().slice(0, 7);

    const where: Record<string, unknown> = {};
    if (type !== "all") {
      where.type = type;
      if (type === "daily") where.period = today;
      if (type === "weekly") where.period = weekNum;
      if (type === "monthly") where.period = month;
    }

    const awards = await db.award.findMany({
      where,
      include: {
        journey: {
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: [{ period: "desc" }, { rank: "asc" }],
      take: 30,
    });

    // Group by type and period
    type AwardItem = typeof awards[number];
    type AwardGroup = Record<string, { type: string; period: string; winners: { rank: number; journey: unknown }[] }>;
    const grouped = awards.reduce((acc: AwardGroup, award: AwardItem) => {
      const key = `${award.type}-${award.period}`;
      if (!acc[key]) {
        acc[key] = { type: award.type, period: award.period, winners: [] };
      }
      acc[key].winners.push({
        rank: award.rank,
        journey: award.journey,
      });
      return acc;
    }, {} as AwardGroup);

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    console.error("Error fetching awards:", error);
    return NextResponse.json({ error: "Failed to fetch awards" }, { status: 500 });
  }
}

function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

// POST calculate and assign awards (called by cron job or manually)
export async function POST(req: Request) {
  try {
    const { type } = await req.json(); // daily, weekly, monthly
    
    const now = new Date();
    let period: string;
    let startDate: Date;

    switch (type) {
      case "daily":
        period = now.toISOString().split("T")[0];
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "weekly":
        period = getWeekNumber(now);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        period = now.toISOString().slice(0, 7);
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return NextResponse.json({ error: "Invalid award type" }, { status: 400 });
    }

    // Get top 3 journeys for the period
    const topJourneys = await db.journey.findMany({
      where: {
        published: true,
        createdAt: { gte: startDate },
      },
      orderBy: { voteCount: "desc" },
      take: 3,
    });

    // Create awards
    const awards = await Promise.all(
      topJourneys.map((journey, index) =>
        db.award.upsert({
          where: { type_period_rank: { type, period, rank: index + 1 } },
          create: {
            type,
            period,
            rank: index + 1,
            journeyId: journey.id,
          },
          update: {
            journeyId: journey.id,
          },
        })
      )
    );

    return NextResponse.json({ message: "Awards calculated", awards });
  } catch (error) {
    console.error("Error calculating awards:", error);
    return NextResponse.json({ error: "Failed to calculate awards" }, { status: 500 });
  }
}
