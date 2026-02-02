import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Calendar,
  TrendingUp,
  Star,
  ArrowUp,
} from "lucide-react";
import Link from "next/link";

// Mock data
const dailyWinners = [
  {
    rank: 1,
    journey: {
      id: "1",
      title: "Building a Full SaaS App with Claude in 4 Hours",
      voteCount: 342,
      author: { name: "Alex Chen", image: "" },
    },
  },
  {
    rank: 2,
    journey: {
      id: "2",
      title: "From Idea to MVP: AI-Powered Content Calendar",
      voteCount: 289,
      author: { name: "Sarah Miller", image: "" },
    },
  },
  {
    rank: 3,
    journey: {
      id: "3",
      title: "Creating a Brand Identity System with Midjourney",
      voteCount: 256,
      author: { name: "James Wright", image: "" },
    },
  },
];

const weeklyWinners = [
  {
    rank: 1,
    journey: {
      id: "4",
      title: "30-Day Journey: Writing a Technical Book with AI",
      voteCount: 1247,
      author: { name: "Emily Zhang", image: "" },
    },
  },
  {
    rank: 2,
    journey: {
      id: "5",
      title: "Building an AI-Powered Customer Support System",
      voteCount: 1089,
      author: { name: "Michael Torres", image: "" },
    },
  },
  {
    rank: 3,
    journey: {
      id: "6",
      title: "From Zero to Hero: Learning Python with GPT",
      voteCount: 956,
      author: { name: "Lisa Park", image: "" },
    },
  },
];

const monthlyWinners = [
  {
    rank: 1,
    journey: {
      id: "7",
      title: "Building a $10K MRR Product Using Only AI Assistance",
      voteCount: 4521,
      author: { name: "David Kim", image: "" },
    },
  },
  {
    rank: 2,
    journey: {
      id: "8",
      title: "Complete E-commerce Empire: AI-Driven from Scratch",
      voteCount: 3876,
      author: { name: "Rachel Green", image: "" },
    },
  },
  {
    rank: 3,
    journey: {
      id: "9",
      title: "The Ultimate Prompt Engineering Masterclass",
      voteCount: 3245,
      author: { name: "Chris Anderson", image: "" },
    },
  },
];

const rankStyles = {
  1: {
    bg: "bg-gradient-to-br from-yellow-500/20 to-amber-500/20",
    border: "border-yellow-500/30",
    icon: Crown,
    iconColor: "text-yellow-400",
    badge: "gold" as const,
  },
  2: {
    bg: "bg-gradient-to-br from-zinc-400/20 to-slate-400/20",
    border: "border-zinc-400/30",
    icon: Medal,
    iconColor: "text-zinc-300",
    badge: "silver" as const,
  },
  3: {
    bg: "bg-gradient-to-br from-orange-600/20 to-amber-700/20",
    border: "border-orange-600/30",
    icon: Award,
    iconColor: "text-orange-400",
    badge: "bronze" as const,
  },
};

function WinnerCard({
  rank,
  journey,
  period,
}: {
  rank: 1 | 2 | 3;
  journey: (typeof dailyWinners)[0]["journey"];
  period: string;
}) {
  const style = rankStyles[rank];
  const Icon = style.icon;

  return (
    <Card className={`${style.bg} ${style.border} border-2`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${style.bg}`}>
            <Icon className={`h-8 w-8 ${style.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <Badge variant={style.badge} className="mb-2">
              #{rank} {period}
            </Badge>
            <Link href={`/journeys/${journey.id}`}>
              <h3 className="font-semibold text-zinc-100 hover:text-violet-300 transition-colors line-clamp-2 mb-2">
                {journey.title}
              </h3>
            </Link>
            <div className="flex items-center gap-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={journey.author.image} />
                <AvatarFallback className="text-xs">
                  {journey.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-zinc-400">{journey.author.name}</span>
              <div className="flex items-center gap-1 text-violet-400">
                <ArrowUp className="h-4 w-4" />
                <span className="font-semibold">{journey.voteCount}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AwardsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-6">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-300">Community Awards</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            Hall of Fame
          </span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Celebrating the best prompt journeys voted by our community. Get featured by sharing your AI adventures!
        </p>
      </div>

      {/* Daily Awards */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-violet-500/20">
            <Star className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Today&apos;s Top Journeys</h2>
            <p className="text-sm text-zinc-500">February 2, 2026</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dailyWinners.map((winner) => (
            <WinnerCard
              key={winner.rank}
              rank={winner.rank as 1 | 2 | 3}
              journey={winner.journey}
              period="Daily"
            />
          ))}
        </div>
      </section>

      {/* Weekly Awards */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-cyan-500/20">
            <TrendingUp className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">This Week&apos;s Champions</h2>
            <p className="text-sm text-zinc-500">Week 5, 2026</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {weeklyWinners.map((winner) => (
            <WinnerCard
              key={winner.rank}
              rank={winner.rank as 1 | 2 | 3}
              journey={winner.journey}
              period="Weekly"
            />
          ))}
        </div>
      </section>

      {/* Monthly Awards */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-amber-500/20">
            <Calendar className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">January 2026 Winners</h2>
            <p className="text-sm text-zinc-500">Monthly Hall of Fame</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {monthlyWinners.map((winner) => (
            <WinnerCard
              key={winner.rank}
              rank={winner.rank as 1 | 2 | 3}
              journey={winner.journey}
              period="Monthly"
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-violet-500/30">
        <CardContent className="py-8 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-violet-400" />
          <h3 className="text-2xl font-bold text-zinc-100 mb-2">
            Want to be featured?
          </h3>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            Share your AI prompt journey with the community. The best journeys get featured and win awards!
          </p>
          <Link href="/journeys/new">
            <Button variant="glow" size="lg">
              Start Your Journey
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
