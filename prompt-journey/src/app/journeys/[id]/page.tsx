"use client";

import { use, useState } from "react";
import { useSession } from "next-auth/react";
import { useJourney, useCreateComment } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Eye,
  Share2,
  Bookmark,
  Trophy,
  ArrowLeft,
  Copy,
  Check,
  Calendar,
  User,
  Send,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { cn, formatRelativeTime, formatDate } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  prompt: string;
  result: string;
  notes?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  replies?: Comment[];
}

const awardColors: Record<number, "gold" | "silver" | "bronze"> = {
  1: "gold",
  2: "silver",
  3: "bronze",
};

export default function JourneyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { journey, isLoading, mutate } = useJourney(id);
  const { createComment, isLoading: isCommenting } = useCreateComment(id);
  
  const [voteCount, setVoteCount] = useState(0);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Update local state when journey loads
  useState(() => {
    if (journey) {
      setVoteCount(journey.voteCount);
      setUserVote(journey.userVote ?? null);
    }
  });

  const handleVote = async (value: 1 | -1) => {
    if (!session) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch(`/api/journeys/${id}/vote`, {
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
    }
  };

  const handleCopy = async (text: string, stepId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleComment = async () => {
    if (!comment.trim() || !session) return;
    
    try {
      await createComment({ content: comment, parentId: replyTo || undefined });
      setComment("");
      setReplyTo(null);
      mutate();
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-2/3 mb-8" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <FileText className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
        <h1 className="text-2xl font-bold text-zinc-100">Journey Not Found</h1>
        <p className="text-zinc-400 mt-2">This journey doesn&apos;t exist or has been deleted.</p>
        <Link href="/journeys">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Journeys
          </Button>
        </Link>
      </div>
    );
  }

  // Parse content (steps) from JSON string
  let steps: Step[] = [];
  try {
    steps = JSON.parse(journey.content || "[]");
  } catch {
    steps = [];
  }

  const tags = typeof journey.tags === "string"
    ? journey.tags.split(",").filter(Boolean)
    : [];

  const displayVoteCount = journey.voteCount !== voteCount ? voteCount : journey.voteCount;
  const displayUserVote = journey.userVote !== userVote ? userVote : journey.userVote;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link href="/journeys" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-100 mb-8 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Journeys
      </Link>

      {/* Header */}
      <div className="flex gap-6 mb-8">
        {/* Vote Column */}
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-xl transition-colors",
              displayUserVote === 1
                ? "bg-violet-500/20 text-violet-400"
                : "text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10"
            )}
            onClick={() => handleVote(1)}
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
          <span className={cn(
            "text-2xl font-bold tabular-nums",
            displayVoteCount > 0 ? "text-violet-400" : displayVoteCount < 0 ? "text-red-400" : "text-zinc-500"
          )}>
            {displayVoteCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-xl transition-colors",
              displayUserVote === -1
                ? "bg-red-500/20 text-red-400"
                : "text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
            )}
            onClick={() => handleVote(-1)}
          >
            <ArrowDown className="h-6 w-6" />
          </Button>
        </div>

        {/* Title & Meta */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {journey.award && (
              <Badge variant={awardColors[journey.award.rank] || "secondary"} className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {journey.award.type} #{journey.award.rank}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-4">
            {journey.title}
          </h1>
          <p className="text-lg text-zinc-400 mb-4">
            {journey.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag.trim()}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href={`/profile/${journey.author.id}`} className="flex items-center gap-2 hover:text-violet-300 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={journey.author.image || undefined} />
                <AvatarFallback>{journey.author.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <span>{journey.author.name || "Anonymous"}</span>
            </Link>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(journey.createdAt)}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {journey.viewCount} views
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {journey.commentCount} comments
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-6 mb-12">
        <h2 className="text-xl font-semibold text-zinc-100">
          Journey Steps ({steps.length})
        </h2>
        
        {steps.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-zinc-500">
              No steps added to this journey yet.
            </CardContent>
          </Card>
        ) : (
          steps.map((step, index) => (
            <Card key={step.id || index} className="overflow-hidden">
              <CardHeader className="bg-zinc-900/50 border-b border-zinc-800">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 text-sm font-bold">
                    {index + 1}
                  </span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {/* Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-zinc-400">Prompt</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(step.prompt, `prompt-${step.id}`)}
                      className="h-7 text-xs"
                    >
                      {copiedStep === `prompt-${step.id}` ? (
                        <><Check className="h-3 w-3 mr-1" /> Copied</>
                      ) : (
                        <><Copy className="h-3 w-3 mr-1" /> Copy</>
                      )}
                    </Button>
                  </div>
                  <pre className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 whitespace-pre-wrap font-mono">
                    {step.prompt}
                  </pre>
                </div>

                {/* Result */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-zinc-400">Result</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(step.result, `result-${step.id}`)}
                      className="h-7 text-xs"
                    >
                      {copiedStep === `result-${step.id}` ? (
                        <><Check className="h-3 w-3 mr-1" /> Copied</>
                      ) : (
                        <><Copy className="h-3 w-3 mr-1" /> Copy</>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-300 prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-mono">{step.result}</pre>
                  </div>
                </div>

                {/* Notes */}
                {step.notes && (
                  <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                    <h4 className="text-sm font-medium text-violet-300 mb-2">Author Notes</h4>
                    <p className="text-sm text-zinc-400">{step.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Comments Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-violet-400" />
          Comments ({journey.commentCount})
        </h2>

        {/* Comment Form */}
        {session ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback>{session.user.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  {replyTo && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <span>Replying to comment</span>
                      <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleComment} disabled={isCommenting || !comment.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    {isCommenting ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-zinc-400 mb-4">Sign in to join the discussion</p>
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {(journey as unknown as { comments?: Comment[] }).comments?.map((comment: Comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              onReply={() => setReplyTo(comment.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: () => void }) {
  return (
    <div className="flex gap-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.author.image || undefined} />
        <AvatarFallback>{comment.author.name?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/profile/${comment.author.id}`} className="font-medium text-zinc-200 hover:text-violet-300">
            {comment.author.name || "Anonymous"}
          </Link>
          <span className="text-xs text-zinc-500">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-zinc-400 text-sm mb-2">{comment.content}</p>
        <Button variant="ghost" size="sm" onClick={onReply} className="text-xs text-zinc-500">
          Reply
        </Button>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 ml-4 border-l-2 border-zinc-800 pl-4 space-y-4">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={reply.author.image || undefined} />
                  <AvatarFallback className="text-xs">{reply.author.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/profile/${reply.author.id}`} className="font-medium text-sm text-zinc-200 hover:text-violet-300">
                      {reply.author.name || "Anonymous"}
                    </Link>
                    <span className="text-xs text-zinc-500">
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
