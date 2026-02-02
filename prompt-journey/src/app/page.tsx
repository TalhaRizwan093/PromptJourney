import { JourneyCard } from "@/components/journey/journey-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import Link from "next/link";

// Mock data for MVP - will be replaced with real data from database
const mockJourneys = [
  {
    id: "1",
    title: "Building a Full SaaS App with Claude in 4 Hours",
    description: "My journey of using AI prompts to build a complete subscription-based SaaS application, from database design to deployment. Includes all prompts and iterations.",
    tags: ["coding", "saas", "claude", "nextjs"],
    voteCount: 342,
    viewCount: 1250,
    commentCount: 47,
    createdAt: new Date(Date.now() - 3600000 * 2),
    author: { name: "Alex Chen", image: "" },
    award: { type: "daily" as const, rank: 1 as const },
  },
  {
    id: "2",
    title: "From Idea to MVP: AI-Powered Content Calendar",
    description: "How I used a series of prompts to design, develop, and launch a content calendar tool. Complete with prompt chains and lessons learned.",
    tags: ["productivity", "chatgpt", "no-code", "business"],
    voteCount: 289,
    viewCount: 980,
    commentCount: 32,
    createdAt: new Date(Date.now() - 3600000 * 8),
    author: { name: "Sarah Miller" },
  },
  {
    id: "3",
    title: "Creating a Brand Identity System with Midjourney + GPT",
    description: "A complete walkthrough of creating a cohesive brand identity including logo concepts, color palettes, and brand guidelines using AI tools.",
    tags: ["design", "branding", "midjourney", "creative"],
    voteCount: 256,
    viewCount: 890,
    commentCount: 28,
    createdAt: new Date(Date.now() - 3600000 * 12),
    author: { name: "James Wright" },
  },
  {
    id: "4",
    title: "Writing a Technical Book with AI Assistance",
    description: "My 30-day journey of writing a 200-page technical book using AI for research, outlining, drafting, and editing. Prompt templates included.",
    tags: ["writing", "education", "books", "productivity"],
    voteCount: 198,
    viewCount: 670,
    commentCount: 19,
    createdAt: new Date(Date.now() - 3600000 * 24),
    author: { name: "Emily Zhang" },
    award: { type: "weekly" as const, rank: 2 as const },
  },
  {
    id: "5",
    title: "Automating My Entire Business Workflow",
    description: "From customer support to invoicing - how I used AI prompts to automate 80% of my small business operations.",
    tags: ["automation", "business", "workflow", "efficiency"],
    voteCount: 176,
    viewCount: 540,
    commentCount: 24,
    createdAt: new Date(Date.now() - 3600000 * 36),
    author: { name: "Michael Torres" },
  },
];

const stats = [
  { label: "Active Journeys", value: "2,847", icon: FileText },
  { label: "Community Members", value: "12.5K", icon: Users },
  { label: "Prompts Shared", value: "45.2K", icon: Zap },
];

const filterTabs = [
  { label: "Hot", icon: Flame, active: true },
  { label: "Trending", icon: TrendingUp },
  { label: "New", icon: Clock },
  { label: "Top", icon: Trophy },
];

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 mb-6">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-violet-300">Share your AI journey</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab.active
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
          {mockJourneys.length} journeys
        </Badge>
      </div>

      {/* Journey List */}
      <div className="space-y-4 mb-8">
        {mockJourneys.map((journey) => (
          <JourneyCard key={journey.id} journey={journey} />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          Load More Journeys
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
