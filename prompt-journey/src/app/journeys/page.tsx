"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { JourneyCard } from "@/components/journey/journey-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  TrendingUp,
  Clock,
  Trophy,
  Flame,
  Search,
  Filter,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { useJourneys } from "@/lib/hooks";

type SortType = "hot" | "trending" | "new" | "top";

const filterTabs: { label: string; value: SortType; icon: React.ElementType }[] = [
  { label: "Hot", value: "hot", icon: Flame },
  { label: "Trending", value: "trending", icon: TrendingUp },
  { label: "New", value: "new", icon: Clock },
  { label: "Top", value: "top", icon: Trophy },
];

function JourneyCardSkeleton() {
  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-zinc-800 rounded" />
          <div className="w-6 h-4 bg-zinc-800 rounded" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-zinc-800 rounded w-3/4" />
          <div className="h-4 bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-800 rounded w-1/2" />
          <div className="flex gap-2 mt-4">
            <div className="h-6 w-16 bg-zinc-800 rounded-full" />
            <div className="h-6 w-20 bg-zinc-800 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneysContent() {
  const searchParams = useSearchParams();
  const [sort, setSort] = useState<SortType>("hot");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Get search from URL params
  useEffect(() => {
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setSearch(searchQuery);
    }
  }, [searchParams]);

  const { journeys, total, pages, isLoading, error } = useJourneys({ sort, search, page });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-violet-400" />
            Prompt Journeys
          </h1>
          <p className="text-zinc-400 mt-1">
            Discover how others use AI to build amazing things
          </p>
        </div>
        <Link href="/journeys/new">
          <Button variant="default">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Journey
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
          <Input
            type="search"
            placeholder="Search journeys..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = sort === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setSort(tab.value);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
        <div className="flex-1" />
        <Badge variant="secondary">
          {total} {total === 1 ? "journey" : "journeys"}
        </Badge>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12 text-red-400">
          Failed to load journeys. Please try again.
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <JourneyCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Journey List */}
      {!isLoading && !error && (
        <>
          {journeys.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-300">No journeys found</h3>
              <p className="text-zinc-500 mt-1">
                {search ? "Try a different search term" : "Be the first to share your journey!"}
              </p>
              <Link href="/journeys/new">
                <Button className="mt-4">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Journey
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {journeys.map((journey) => (
                <JourneyCard
                  key={journey.id}
                  journey={{
                    ...journey,
                    tags: typeof journey.tags === "string"
                      ? journey.tags.split(",").filter(Boolean)
                      : journey.tags || [],
                    commentCount: journey._count?.comments ?? 0,
                    createdAt: new Date(journey.createdAt),
                    award: journey.awards?.[0] ? {
                      type: journey.awards[0].type as "daily" | "weekly" | "monthly",
                      rank: journey.awards[0].rank as 1 | 2 | 3,
                    } : undefined,
                  }}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                let pageNum: number;
                if (pages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= pages - 2) {
                  pageNum = pages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={pageNum === page 
                      ? "bg-violet-500/20 text-violet-300 border-violet-500/30" 
                      : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                disabled={page === pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function JourneysPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <JourneyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <JourneysContent />
    </Suspense>
  );
}
