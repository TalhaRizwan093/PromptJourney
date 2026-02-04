"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
  BookmarkCheck,
  Share2,
  Trophy,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Journey } from "@/lib/hooks";

interface JourneyCardProps {
  journey: Journey | {
    id: string;
    title: string;
    description: string;
    tags: string | string[];
    voteCount: number;
    viewCount: number;
    commentCount: number;
    createdAt: Date | string;
    author: {
      id?: string;
      name: string | null;
      image?: string | null;
    };
    award?: {
      type: string;
      rank: number;
    } | null;
    userVote?: number | null;
  };
  compact?: boolean;
}

const awardColors: Record<number, "gold" | "silver" | "bronze"> = {
  1: "gold",
  2: "silver",
  3: "bronze",
};

const awardLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function JourneyCard({ journey, compact = false }: JourneyCardProps) {
  const { data: session } = useSession();
  const [voteCount, setVoteCount] = useState(journey.voteCount);
  const [userVote, setUserVote] = useState<number | null>(journey.userVote ?? null);
  const [isVoting, setIsVoting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Check if journey is bookmarked on mount
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem("bookmarkedJourneys") || "[]");
    setIsBookmarked(bookmarks.includes(journey.id));
  }, [journey.id]);

  // Parse tags - handle both string and array formats
  const tags = typeof journey.tags === "string" 
    ? journey.tags.split(",").filter(Boolean)
    : journey.tags;

  const handleVote = async (value: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setIsVoting(true);
    try {
      const res = await fetch(`/api/journeys/${journey.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setVoteCount(data.voteCount);
        setUserVote(data.userVote);
      }
    } catch (error) {
      console.error("Vote failed:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleCardClick = async (e: React.MouseEvent) => {
    // Only navigate if not clicking on a button or link
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    // Increment view count
    try {
      await fetch(`/api/journeys/${journey.id}`, { method: "GET" });
    } catch {}
    window.location.href = `/journeys/${journey.id}`;
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/journeys/${journey.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: journey.title, url });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem("bookmarkedJourneys") || "[]");
    if (isBookmarked) {
      const updated = bookmarks.filter((id: string) => id !== journey.id);
      localStorage.setItem("bookmarkedJourneys", JSON.stringify(updated));
      setIsBookmarked(false);
    } else {
      bookmarks.push(journey.id);
      localStorage.setItem("bookmarkedJourneys", JSON.stringify(bookmarks));
      setIsBookmarked(true);
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        journey.award && "ring-2 ring-yellow-500/30"
      )}
      onClick={handleCardClick}
    >
      {/* Gradient accent on hover */}
      <div className="absolute inset-0 bg-linear-to-r from-violet-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Award badge */}
      {journey.award && (
        <div className="absolute top-4 right-4">
          <Badge variant={awardColors[journey.award.rank] || "secondary"} className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            {awardLabels[journey.award.type] || journey.award.type} #{journey.award.rank}
          </Badge>
        </div>
      )}

      <div className="flex">
        {/* Vote Column */}
        <div className="flex flex-col items-center gap-1 p-4 border-r border-zinc-800 dark:border-zinc-800 light:border-zinc-200">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "h-8 w-8 transition-colors",
              userVote === 1 
                ? "text-violet-400 bg-violet-500/20" 
                : "text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10"
            )}
            onClick={(e) => handleVote(1, e)}
            disabled={isVoting}
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
          <span className={cn(
            "text-sm font-bold tabular-nums",
            voteCount > 0 ? "text-violet-400" : voteCount < 0 ? "text-red-400" : "text-zinc-500"
          )}>
            {voteCount}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "h-8 w-8 transition-colors",
              userVote === -1 
                ? "text-red-400 bg-red-500/20" 
                : "text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
            )}
            onClick={(e) => handleVote(-1, e)}
            disabled={isVoting}
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={journey.author?.image || undefined} />
                <AvatarFallback className="text-xs" name={journey.author?.name} />
              </Avatar>
              <Link 
                href={journey.author?.id ? `/profile/${journey.author.id}` : "#"}
                className="text-sm text-zinc-400 hover:text-violet-300 transition-colors"
              >
                {journey.author?.name || "Anonymous"}
              </Link>
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
              {tags.slice(0, 3).map((tag) => (
                <Link key={tag} href={`/journeys?tag=${encodeURIComponent(tag.trim())}`}>
                  <Badge variant="secondary" className="text-xs hover:bg-zinc-700 transition-colors">
                    {tag.trim()}
                  </Badge>
                </Link>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-zinc-500">+{tags.length - 3}</span>
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
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                  isBookmarked && "opacity-100 text-violet-400"
                )}
                onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
              >
                {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
              >
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
            {journey.author?.name || "Anonymous"} • {formatRelativeTime(journey.createdAt)}
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
