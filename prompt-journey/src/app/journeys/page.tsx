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

// Mock data - will be replaced with real database queries
const mockJourneys = [
  {
    id: "1",
    title: "Building a Full SaaS App with Claude in 4 Hours",
    description: "My journey of using AI prompts to build a complete subscription-based SaaS application, from database design to deployment.",
    tags: ["coding", "saas", "claude", "nextjs"],
    voteCount: 342,
    viewCount: 1250,
    commentCount: 47,
    createdAt: new Date(Date.now() - 3600000 * 2),
    author: { name: "Alex Chen" },
    award: { type: "daily" as const, rank: 1 as const },
  },
  {
    id: "2",
    title: "From Idea to MVP: AI-Powered Content Calendar",
    description: "How I used a series of prompts to design, develop, and launch a content calendar tool.",
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
    description: "A complete walkthrough of creating a cohesive brand identity including logo concepts and brand guidelines.",
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
    description: "My 30-day journey of writing a 200-page technical book using AI for research and editing.",
    tags: ["writing", "education", "books", "productivity"],
    voteCount: 198,
    viewCount: 670,
    commentCount: 19,
    createdAt: new Date(Date.now() - 3600000 * 24),
    author: { name: "Emily Zhang" },
  },
  {
    id: "5",
    title: "Automating My Entire Business Workflow",
    description: "From customer support to invoicing - how I used AI prompts to automate 80% of operations.",
    tags: ["automation", "business", "workflow", "efficiency"],
    voteCount: 176,
    viewCount: 540,
    commentCount: 24,
    createdAt: new Date(Date.now() - 3600000 * 36),
    author: { name: "Michael Torres" },
  },
  {
    id: "6",
    title: "Building an E-commerce Store with AI in a Weekend",
    description: "Complete journey from product research to fully functional store using AI assistance.",
    tags: ["ecommerce", "business", "coding", "shopify"],
    voteCount: 145,
    viewCount: 420,
    commentCount: 16,
    createdAt: new Date(Date.now() - 3600000 * 48),
    author: { name: "Lisa Park" },
  },
];

const filterTabs = [
  { label: "Hot", icon: Flame, active: true },
  { label: "Trending", icon: TrendingUp },
  { label: "New", icon: Clock },
  { label: "Top", icon: Trophy },
];

export default function JourneysPage() {
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
          return (
            <button
              key={tab.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
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
        <Badge variant="secondary">
          {mockJourneys.length} journeys
        </Badge>
      </div>

      {/* Journey List */}
      <div className="space-y-4">
        {mockJourneys.map((journey) => (
          <JourneyCard key={journey.id} journey={journey} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
        <Button variant="outline" size="sm" className="bg-violet-500/20 text-violet-300 border-violet-500/30">
          1
        </Button>
        <Button variant="outline" size="sm">
          2
        </Button>
        <Button variant="outline" size="sm">
          3
        </Button>
        <Button variant="outline" size="sm">
          Next
        </Button>
      </div>
    </div>
  );
}
