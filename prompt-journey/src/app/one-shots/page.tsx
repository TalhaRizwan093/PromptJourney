"use client";

import { useState } from "react";
import { OneShotCard } from "@/components/oneshot/oneshot-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Zap,
  Search,
  Filter,
  PlusCircle,
  Code,
  Pencil,
  Palette,
  Briefcase,
  GraduationCap,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

// Mock data
const mockOneShots = [
  {
    id: "1",
    title: "Code Review Assistant",
    prompt: `Review this code for potential issues, security vulnerabilities, and improvements. Focus on:
1. Performance optimizations
2. Security concerns
3. Code readability
4. Best practices

[Paste your code here]

Provide specific suggestions with code examples.`,
    result: "Provides detailed code analysis with specific improvement suggestions and refactored examples.",
    category: "Coding",
    copyCount: 2341,
    author: { name: "DevMaster" },
  },
  {
    id: "2",
    title: "Blog Post Generator",
    prompt: `Write a comprehensive blog post about [TOPIC] that:
- Hooks the reader in the first paragraph
- Uses subheadings for easy scanning
- Includes practical examples
- Has a clear call-to-action
- Is SEO-optimized for the keyword: [KEYWORD]

Target length: 1500 words
Tone: Professional but conversational`,
    result: "Generates a well-structured, engaging blog post ready for publishing.",
    category: "Writing",
    copyCount: 1876,
    author: { name: "ContentPro" },
  },
  {
    id: "3",
    title: "UI Color Palette Generator",
    prompt: `Create a modern UI color palette for a [TYPE] application with:
- Primary color based on: [BASE COLOR or MOOD]
- Secondary and accent colors
- Semantic colors (success, warning, error, info)
- Dark mode variants
- CSS custom properties format

Include hex codes and suggest use cases for each color.`,
    category: "Design",
    copyCount: 1543,
    author: { name: "DesignGuru" },
  },
  {
    id: "4",
    title: "Business Email Writer",
    prompt: `Write a professional email for the following situation:

Context: [DESCRIBE THE SITUATION]
Recipient: [WHO ARE YOU WRITING TO]
Goal: [WHAT DO YOU WANT TO ACHIEVE]
Tone: [FORMAL/FRIENDLY/URGENT]

Include a clear subject line and call-to-action.`,
    result: "Generates professional, context-appropriate emails with proper formatting.",
    category: "Business",
    copyCount: 1298,
    author: { name: "BizWriter" },
  },
  {
    id: "5",
    title: "Explain Like I'm 5",
    prompt: `Explain [COMPLEX TOPIC] in simple terms that a 5-year-old could understand. Use:
- Simple analogies
- Everyday examples
- Short sentences
- No jargon

Then provide progressively more detailed explanations for ages 10, 15, and adult level.`,
    result: "Breaks down complex topics into understandable explanations for different levels.",
    category: "Education",
    copyCount: 1156,
    author: { name: "TeachSimple" },
  },
  {
    id: "6",
    title: "Social Media Hook Generator",
    prompt: `Generate 10 scroll-stopping hooks for [PLATFORM] about [TOPIC].

Requirements:
- Under 280 characters each
- Include pattern interrupts
- Create curiosity gaps
- Use power words
- Vary formats (questions, statements, challenges)

Rate each hook from 1-10 on engagement potential.`,
    category: "Marketing",
    copyCount: 987,
    author: { name: "SocialPro" },
  },
];

const categories = [
  { label: "All", icon: Zap, count: 156 },
  { label: "Coding", icon: Code, count: 42 },
  { label: "Writing", icon: Pencil, count: 38 },
  { label: "Design", icon: Palette, count: 28 },
  { label: "Business", icon: Briefcase, count: 24 },
  { label: "Education", icon: GraduationCap, count: 15 },
  { label: "Marketing", icon: Megaphone, count: 9 },
];

export default function OneShotsPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredOneShots = activeCategory === "All"
    ? mockOneShots
    : mockOneShots.filter((p) => p.category === activeCategory);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
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
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {category.label}
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {category.count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Prompt Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOneShots.map((oneShot) => (
          <OneShotCard key={oneShot.id} oneShot={oneShot} />
        ))}
      </div>

      {/* Empty State */}
      {filteredOneShots.length === 0 && (
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

      {/* Load More */}
      {filteredOneShots.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Load More Prompts
          </Button>
        </div>
      )}
    </div>
  );
}
