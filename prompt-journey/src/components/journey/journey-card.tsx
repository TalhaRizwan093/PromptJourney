import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Eye,
  Bookmark,
  Share2,
  Trophy,
  Sparkles,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

interface JourneyCardProps {
  journey: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    voteCount: number;
    viewCount: number;
    commentCount: number;
    createdAt: Date | string;
    author: {
      name: string;
      image?: string;
    };
    award?: {
      type: "daily" | "weekly" | "monthly";
      rank: 1 | 2 | 3;
    };
  };
  compact?: boolean;
}

const awardColors = {
  1: "gold",
  2: "silver",
  3: "bronze",
} as const;

const awardLabels = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function JourneyCard({ journey, compact = false }: JourneyCardProps) {
  return (
    <Card className={cn(
      "group relative overflow-hidden",
      journey.award && "ring-2 ring-yellow-500/30"
    )}>
      {/* Gradient accent on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Award badge */}
      {journey.award && (
        <div className="absolute top-4 right-4">
          <Badge variant={awardColors[journey.award.rank]} className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            {awardLabels[journey.award.type]} #{journey.award.rank}
          </Badge>
        </div>
      )}

      <div className="flex">
        {/* Vote Column */}
        <div className="flex flex-col items-center gap-1 p-4 border-r border-zinc-800">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10">
            <ArrowUp className="h-5 w-5" />
          </Button>
          <span className={cn(
            "text-sm font-bold",
            journey.voteCount > 0 ? "text-violet-400" : journey.voteCount < 0 ? "text-red-400" : "text-zinc-500"
          )}>
            {journey.voteCount}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={journey.author.image} />
                <AvatarFallback className="text-xs">
                  {journey.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-zinc-400">{journey.author.name}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-sm text-zinc-500">
                {formatRelativeTime(journey.createdAt)}
              </span>
            </div>
            <Link href={`/journeys/${journey.id}`}>
              <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-violet-300 transition-colors line-clamp-2">
                {journey.title}
              </h3>
            </Link>
          </CardHeader>

          {!compact && (
            <CardContent className="py-2">
              <p className="text-sm text-zinc-400 line-clamp-2">
                {journey.description}
              </p>
            </CardContent>
          )}

          <CardFooter className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {journey.tags.slice(0, 3).map((tag) => (
                <Link key={tag} href={`/tag/${tag}`}>
                  <Badge variant="secondary" className="text-xs hover:bg-zinc-700 transition-colors">
                    {tag}
                  </Badge>
                </Link>
              ))}
              {journey.tags.length > 3 && (
                <span className="text-xs text-zinc-500">+{journey.tags.length - 3}</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-zinc-500">
              <div className="flex items-center gap-1 text-xs">
                <MessageSquare className="h-4 w-4" />
                {journey.commentCount}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Eye className="h-4 w-4" />
                {journey.viewCount}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}

// Compact version for sidebar/lists
export function JourneyCardCompact({ journey }: { journey: JourneyCardProps["journey"] }) {
  return (
    <Link href={`/journeys/${journey.id}`} className="block group">
      <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-all duration-200">
        <div className="flex flex-col items-center">
          <span className={cn(
            "text-sm font-bold",
            journey.voteCount > 0 ? "text-violet-400" : "text-zinc-500"
          )}>
            {journey.voteCount}
          </span>
          <ArrowUp className="h-3 w-3 text-zinc-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-zinc-300 group-hover:text-violet-300 transition-colors line-clamp-2">
            {journey.title}
          </h4>
          <p className="text-xs text-zinc-500 mt-1">
            {journey.author.name} • {formatRelativeTime(journey.createdAt)}
          </p>
        </div>
        {journey.award && (
          <Trophy className={cn(
            "h-4 w-4 shrink-0",
            journey.award.rank === 1 && "text-yellow-400",
            journey.award.rank === 2 && "text-zinc-400",
            journey.award.rank === 3 && "text-orange-400"
          )} />
        )}
      </div>
    </Link>
  );
}
