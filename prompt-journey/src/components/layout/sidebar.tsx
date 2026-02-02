"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Flame,
  Clock,
  Award,
  Tag,
  Users,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trending", label: "Trending", icon: Flame },
  { href: "/recent", label: "Recent", icon: Clock },
  { href: "/top", label: "Top Rated", icon: Award },
];

const categories = [
  { label: "Coding", color: "bg-blue-500" },
  { label: "Writing", color: "bg-emerald-500" },
  { label: "Art & Design", color: "bg-pink-500" },
  { label: "Business", color: "bg-amber-500" },
  { label: "Education", color: "bg-purple-500" },
  { label: "Marketing", color: "bg-orange-500" },
];

const resources = [
  { href: "/about", label: "About", icon: HelpCircle },
  { href: "/community", label: "Community", icon: Users },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-800 bg-zinc-950/50 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-300 border border-violet-500/30"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                )}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center gap-2 px-3 mb-3">
            <Tag className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Categories
            </span>
          </div>
          <div className="space-y-1">
            {categories.map((category) => (
              <Link
                key={category.label}
                href={`/category/${category.label.toLowerCase().replace(/ & /g, "-")}`}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200"
              >
                <span className={cn("w-2 h-2 rounded-full", category.color)} />
                {category.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div>
          <div className="flex items-center gap-2 px-3 mb-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Resources
            </span>
          </div>
          <div className="space-y-1">
            {resources.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Promo Card */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30">
          <h3 className="font-semibold text-zinc-100 mb-1">Share Your Journey</h3>
          <p className="text-xs text-zinc-400 mb-3">
            Document your AI adventures and inspire the community!
          </p>
          <Link
            href="/journeys/new"
            className="inline-flex items-center text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Start Writing →
          </Link>
        </div>
      </div>
    </aside>
  );
}
