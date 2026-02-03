"use client";

import { use, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { JourneyCard } from "@/components/journey/journey-card";
import { OneShotCard } from "@/components/oneshot/oneshot-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  FileText,
  Zap,
  ArrowUp,
  Edit2,
  Save,
  X,
  Trash2,
  Loader2,
  Settings,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"journeys" | "oneshots">("journeys");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: user, isLoading, mutate } = useSWR(
    id ? `/api/users/${id}` : null,
    fetcher
  );

  const { data: oneShotsData, mutate: mutateOneShots } = useSWR(
    id && activeTab === "oneshots" ? `/api/users/${id}/one-shots` : null,
    fetcher
  );

  const isOwner = session?.user?.id === id;

  const handleEdit = () => {
    setEditName(user?.name || "");
    setEditBio(user?.bio || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, bio: editBio }),
      });
      if (res.ok) {
        mutate();
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJourney = async (journeyId: string) => {
    if (!confirm("Are you sure you want to delete this journey? This cannot be undone.")) return;
    
    setDeletingId(journeyId);
    try {
      const res = await fetch(`/api/journeys/${journeyId}`, { method: "DELETE" });
      if (res.ok) {
        mutate();
      } else {
        alert("Failed to delete journey");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete journey");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteOneShot = async (oneShotId: string) => {
    if (!confirm("Are you sure you want to delete this one-shot? This cannot be undone.")) return;
    
    setDeletingId(oneShotId);
    try {
      const res = await fetch(`/api/one-shots/${oneShotId}`, { method: "DELETE" });
      if (res.ok) {
        mutateOneShots();
        mutate();
      } else {
        alert("Failed to delete one-shot");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete one-shot");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-start gap-6 mb-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <h1 className="text-2xl font-bold text-zinc-100">User Not Found</h1>
        <p className="text-zinc-400 mt-2">This user doesn&apos;t exist or has been deleted.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile Header */}
      <div className="relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 mb-8">
        <div className="absolute inset-0 bg-linear-to-br from-violet-600/10 to-indigo-600/10 rounded-2xl" />
        
        <div className="relative flex items-start gap-6">
          <Avatar className="h-24 w-24 border-4 border-violet-500/30">
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback className="text-3xl bg-violet-600">
              {user.name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="text-xl font-bold"
                />
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-zinc-100">
                    {user.name || "Anonymous"}
                  </h1>
                  {isOwner && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={handleEdit}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Link href="/settings">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                <p className="text-zinc-400 mb-4">
                  {user.bio || "No bio yet"}
                </p>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(user.createdAt)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        {!isEditing && (
          <div className="relative grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-violet-400">
                <FileText className="h-5 w-5" />
                <span className="text-2xl font-bold">{user.journeyCount || 0}</span>
              </div>
              <p className="text-sm text-zinc-500">Journeys</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-fuchsia-400">
                <Zap className="h-5 w-5" />
                <span className="text-2xl font-bold">{user.oneShotCount || 0}</span>
              </div>
              <p className="text-sm text-zinc-500">One-Shots</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <ArrowUp className="h-5 w-5" />
                <span className="text-2xl font-bold">{user.totalVotes || 0}</span>
              </div>
              <p className="text-sm text-zinc-500">Total Votes</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab("journeys")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "journeys"
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          Journeys ({user.journeyCount || 0})
        </button>
        <button
          onClick={() => setActiveTab("oneshots")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "oneshots"
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          }`}
        >
          <Zap className="h-4 w-4" />
          One-Shots ({user.oneShotCount || 0})
        </button>
      </div>

      {/* Journeys Tab */}
      {activeTab === "journeys" && (
        <div className="space-y-4">
          {!user.journeys || user.journeys.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No journeys yet</p>
              {isOwner && (
                <Link href="/journeys/new">
                  <Button className="mt-4">Create Your First Journey</Button>
                </Link>
              )}
            </div>
          ) : (
            user.journeys.map((journey: { id: string; title: string; description: string; tags: string; voteCount: number; viewCount: number; commentCount?: number; createdAt: string; author: { id: string; name: string | null; image: string | null }; award?: { type: string; rank: number } | null }) => (
              <div key={journey.id} className="relative group">
                <JourneyCard journey={journey} />
                {isOwner && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => handleDeleteJourney(journey.id)}
                    disabled={deletingId === journey.id}
                  >
                    {deletingId === journey.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* One-Shots Tab */}
      {activeTab === "oneshots" && (
        <div className="grid gap-4 md:grid-cols-2">
          {!oneShotsData?.oneShots || oneShotsData.oneShots.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-zinc-500">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No one-shots yet</p>
              {isOwner && (
                <Link href="/one-shots/new">
                  <Button className="mt-4">Create Your First One-Shot</Button>
                </Link>
              )}
            </div>
          ) : (
            oneShotsData.oneShots.map((oneShot: { id: string; title: string; prompt: string; result?: string | null; category: string; copyCount: number; author: { id?: string; name: string | null; image?: string | null } }) => (
              <div key={oneShot.id} className="relative group">
                <OneShotCard oneShot={oneShot} />
                {isOwner && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => handleDeleteOneShot(oneShot.id)}
                    disabled={deletingId === oneShot.id}
                  >
                    {deletingId === oneShot.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
