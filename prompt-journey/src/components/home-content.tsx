"use client";

import { useState } from "react";
import { JourneyCard } from "@/components/journey/journey-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useJourneys } from "@/lib/hooks";
import {
  Sparkles,
  TrendingUp,
  Clock,
  Trophy,
  Flame,
  ChevronRight,
  Zap,
  Users,
  FileText,
  Search,
} from "lucide-react";
import Link from "next/link";

const filterTabs = [
  { label: "Hot", value: "hot", icon: Flame },
  { label: "Trending", value: "trending", icon: TrendingUp },
  { label: "New", value: "new", icon: Clock },
  { label: "Top", value: "top", icon: Trophy },
];

export function HomeContent() {
  const [sort, setSort] = useState("hot");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { journeys, total, pages, isLoading } = useJourneys({ sort, search, page });

  const stats = [
    { label: "Active Journeys", value: total > 0 ? total.toString() : "0", icon: FileText },
    { label: "Community Members", value: "—", icon: Users },
    { label: "Prompts Shared", value: "—", icon: Zap },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 mb-6">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-violet-300">Share your AI journey</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            Document Your AI Adventures
          </span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
          Join a community of prompt engineers, vibe coders, and AI enthusiasts sharing their journeys, prompts, and discoveries.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/journeys/new">
            <Button variant="glow" size="lg">
              <Sparkles className="h-5 w-5 mr-2" />
              Start Your Journey
            </Button>
          </Link>
          <Link href="/journeys">
            <Button variant="outline" size="lg">
              Explore Journeys
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="text-center p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800"
            >
              <Icon className="h-6 w-6 mx-auto mb-2 text-violet-400" />
              <p className="text-2xl font-bold text-zinc-100">{stat.value}</p>
              <p className="text-sm text-zinc-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search journeys..."
          className="pl-10"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setSort(tab.value);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                sort === tab.value
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
        <Badge variant="secondary" className="ml-auto">
          {total} journeys
        </Badge>
      </div>

      {/* Journey List */}
      <div className="space-y-4 mb-8">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : journeys.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No journeys found</p>
            <p className="text-sm">Be the first to share your AI journey!</p>
          </div>
        ) : (
          journeys.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-zinc-400">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
