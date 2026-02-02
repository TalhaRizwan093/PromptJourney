"use client";

import { useState } from "react";
import { OneShotCard } from "@/components/oneshot/oneshot-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOneShots } from "@/lib/hooks";
import {
  Zap,
  Search,
  PlusCircle,
  Code,
  Pencil,
  Palette,
  Briefcase,
  GraduationCap,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

const categories = [
  { label: "All", icon: Zap },
  { label: "Coding", icon: Code },
  { label: "Writing", icon: Pencil },
  { label: "Design", icon: Palette },
  { label: "Business", icon: Briefcase },
  { label: "Education", icon: GraduationCap },
  { label: "Marketing", icon: Megaphone },
];

export default function OneShotsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const { oneShots, isLoading } = useOneShots({ 
    category: activeCategory === "All" ? undefined : activeCategory,
    search: search || undefined,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-linear-to-br from-cyan-500/20 to-violet-500/20">
              <Zap className="h-8 w-8 text-cyan-400" />
            </div>
            One-Shot Prompts
          </h1>
          <p className="text-zinc-400 mt-1">
            Ready-to-use prompts for instant results
          </p>
        </div>
        <Link href="/one-shots/new">
          <Button variant="default">
            <PlusCircle className="h-4 w-4 mr-2" />
            Submit Prompt
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
        <Input
          type="search"
          placeholder="Search prompts..."
          className="pl-10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.label;
          return (
            <button
              key={category.label}
              onClick={() => setActiveCategory(category.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-linear-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Prompt Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-24 w-full mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {oneShots.map((oneShot) => (
            <OneShotCard key={oneShot.id} oneShot={oneShot} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && oneShots.length === 0 && (
        <div className="text-center py-16">
          <Zap className="h-16 w-16 mx-auto text-zinc-700 mb-4" />
          <h3 className="text-xl font-semibold text-zinc-400 mb-2">
            No prompts found
          </h3>
          <p className="text-zinc-500">
            Be the first to submit a prompt in this category!
          </p>
        </div>
      )}
    </div>
  );
}
