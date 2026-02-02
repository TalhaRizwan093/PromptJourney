"use client";

import { use } from "react";
import { useSession } from "next-auth/react";
import { useUser } from "@/lib/hooks";
import { JourneyCard } from "@/components/journey/journey-card";
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
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { user, isLoading, mutate } = useUser(id);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);

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
                    <Button variant="ghost" size="sm" onClick={handleEdit}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
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
                <span className="text-2xl font-bold">{user.journeyCount}</span>
              </div>
              <p className="text-sm text-zinc-500">Journeys</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-fuchsia-400">
                <Zap className="h-5 w-5" />
                <span className="text-2xl font-bold">{user.oneShotCount}</span>
              </div>
              <p className="text-sm text-zinc-500">One-Shots</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <ArrowUp className="h-5 w-5" />
                <span className="text-2xl font-bold">{user.totalVotes}</span>
              </div>
              <p className="text-sm text-zinc-500">Total Votes</p>
            </div>
          </div>
        )}
      </div>

      {/* User's Journeys */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <FileText className="h-5 w-5 text-violet-400" />
          Recent Journeys
        </h2>
        
        {user.journeys.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No journeys yet</p>
          </div>
        ) : (
          user.journeys.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} />
          ))
        )}
      </div>
    </div>
  );
}
