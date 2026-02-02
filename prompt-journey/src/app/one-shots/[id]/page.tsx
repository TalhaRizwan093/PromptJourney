"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Copy,
  Check,
  Zap,
  ExternalLink,
  Share2,
  Bookmark,
  User,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface OneShotDetailProps {
  params: Promise<{ id: string }>;
}

export default function OneShotDetailPage({ params }: OneShotDetailProps) {
  const { id } = use(params);
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [copyCount, setCopyCount] = useState(0);

  const { data: oneShot, error, isLoading } = useSWR(
    id ? `/api/one-shots/${id}` : null,
    fetcher
  );

  const handleCopy = async () => {
    if (!oneShot) return;
    await navigator.clipboard.writeText(oneShot.prompt);
    setCopied(true);

    try {
      const res = await fetch(`/api/one-shots/${id}/copy`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCopyCount(data.copyCount);
      }
    } catch (error) {
      console.error("Failed to track copy:", error);
    }

    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-800 rounded w-1/4" />
          <div className="h-12 bg-zinc-800 rounded w-3/4" />
          <div className="h-64 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (error || !oneShot) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-zinc-300 mb-2">One-Shot Not Found</h2>
          <p className="text-zinc-500 mb-4">This prompt doesn't exist or has been removed.</p>
          <Link href="/one-shots">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to One-Shots
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentCopyCount = copyCount || oneShot.copyCount;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link
        href="/one-shots"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-violet-300 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to One-Shots
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-linear-to-br from-cyan-500/20 to-violet-500/20">
            <Zap className="h-6 w-6 text-cyan-400" />
          </div>
          <Badge variant="outline" className="text-sm">
            {oneShot.category}
          </Badge>
          <span className="text-zinc-500">•</span>
          <span className="text-sm text-zinc-400">{currentCopyCount} copies</span>
        </div>

        <h1 className="text-3xl font-bold text-zinc-100 mb-4">{oneShot.title}</h1>

        {/* Author */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={oneShot.author?.image || undefined} />
            <AvatarFallback name={oneShot.author?.name} />
          </Avatar>
          <div>
            <Link
              href={oneShot.author?.id ? `/profile/${oneShot.author.id}` : "#"}
              className="text-sm font-medium text-zinc-300 hover:text-violet-300 transition-colors"
            >
              {oneShot.author?.name || "Anonymous"}
            </Link>
            <p className="text-xs text-zinc-500">
              {new Date(oneShot.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Prompt Card */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-1 bg-linear-to-r from-cyan-500 via-violet-500 to-fuchsia-500" />
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-200">Prompt</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleCopy} size="sm">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </>
                )}
              </Button>
            </div>
          </div>

          <pre className="bg-zinc-800/50 rounded-xl p-6 overflow-x-auto">
            <code className="text-sm text-zinc-300 whitespace-pre-wrap">
              {oneShot.prompt}
            </code>
          </pre>
        </CardContent>
      </Card>

      {/* Example Result */}
      {oneShot.result && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="h-5 w-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-zinc-200">Example Result</h2>
            </div>
            <div className="bg-zinc-800/30 rounded-xl p-6 border border-zinc-800">
              <p className="text-zinc-300 whitespace-pre-wrap">{oneShot.result}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">Usage Tips</h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-violet-400">•</span>
              Replace bracketed placeholders like [TOPIC] with your specific content.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400">•</span>
              Feel free to modify the prompt to better suit your needs.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400">•</span>
              Works best with GPT-4, Claude, or similar advanced models.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
