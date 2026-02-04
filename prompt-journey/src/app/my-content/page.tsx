"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { JourneyCard } from "@/components/journey/journey-card";
import { OneShotCard } from "@/components/oneshot/oneshot-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  FileText,
  Zap,
  Trash2,
  Loader2,
  Search,
  PlusCircle,
  Edit,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MyContentPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"journeys" | "oneshots" | "drafts">("journeys");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: "journey" | "oneshot"; id: string; title: string } | null>(null);

  const { data: userData, isLoading: loadingUser, mutate: mutateUser } = useSWR(
    session?.user?.id ? `/api/users/${session.user.id}` : null,
    fetcher
  );

  const { data: oneShotsData, isLoading: loadingOneShots, mutate: mutateOneShots } = useSWR(
    session?.user?.id && activeTab === "oneshots" ? `/api/users/${session.user.id}/one-shots` : null,
    fetcher
  );

  const { data: draftsData, isLoading: loadingDrafts, mutate: mutateDrafts } = useSWR(
    session?.user?.id && activeTab === "drafts" ? `/api/users/${session.user.id}/drafts` : null,
    fetcher
  );

  const handleDeleteJourney = async (journeyId: string, title?: string) => {
    if (!deleteModal) {
      setDeleteModal({ isOpen: true, type: "journey", id: journeyId, title: title || "this journey" });
      return;
    }
    
    setDeletingId(journeyId);
    try {
      const res = await fetch(`/api/journeys/${journeyId}`, { method: "DELETE" });
      if (res.ok) {
        mutateUser();
        if (activeTab === "drafts") mutateDrafts();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeletingId(null);
      setDeleteModal(null);
    }
  };

  const handleDeleteOneShot = async (oneShotId: string, title?: string) => {
    if (!deleteModal) {
      setDeleteModal({ isOpen: true, type: "oneshot", id: oneShotId, title: title || "this one-shot" });
      return;
    }
    
    setDeletingId(oneShotId);
    try {
      const res = await fetch(`/api/one-shots/${oneShotId}`, { method: "DELETE" });
      if (res.ok) {
        mutateOneShots();
        mutateUser();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeletingId(null);
      setDeleteModal(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    if (deleteModal.type === "journey") {
      setDeletingId(deleteModal.id);
      try {
        const res = await fetch(`/api/journeys/${deleteModal.id}`, { method: "DELETE" });
        if (res.ok) {
          mutateUser();
          if (activeTab === "drafts") mutateDrafts();
        }
      } catch (error) {
        console.error("Failed to delete:", error);
      } finally {
        setDeletingId(null);
        setDeleteModal(null);
      }
    } else {
      setDeletingId(deleteModal.id);
      try {
        const res = await fetch(`/api/one-shots/${deleteModal.id}`, { method: "DELETE" });
        if (res.ok) {
          mutateOneShots();
          mutateUser();
        }
      } catch (error) {
        console.error("Failed to delete:", error);
      } finally {
        setDeletingId(null);
        setDeleteModal(null);
      }
    }
  };

  if (status === "loading" || loadingUser) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <FolderOpen className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">My Content</h1>
        <p className="text-zinc-400 mb-6">Please sign in to view your content</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const filteredJourneys = userData?.journeys?.filter((j: { title: string; description: string }) =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.description.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredOneShots = oneShotsData?.oneShots?.filter((o: { title: string; prompt: string }) =>
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    o.prompt.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredDrafts = draftsData?.drafts?.filter((d: { title: string; description: string }) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.description.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-violet-400" />
            My Content
          </h1>
          <p className="text-zinc-400 mt-1">Manage all your journeys and one-shots</p>
        </div>
        <div className="flex gap-2">
          <Link href="/journeys/new">
            <Button variant="default">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Journey
            </Button>
          </Link>
          <Link href="/one-shots/new">
            <Button variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              New One-Shot
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
        <Input
          type="search"
          placeholder="Search your content..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab("journeys")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "journeys"
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          Journeys ({userData?.journeyCount || 0})
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
          One-Shots ({userData?.oneShotCount || 0})
        </button>
        <button
          onClick={() => setActiveTab("drafts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "drafts"
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          }`}
        >
          <Edit className="h-4 w-4" />
          Drafts
        </button>
      </div>

      {/* Content */}
      {activeTab === "journeys" && (
        <div className="space-y-4">
          {filteredJourneys.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No journeys yet</p>
              <p className="text-sm mb-4">Start documenting your AI adventures!</p>
              <Link href="/journeys/new">
                <Button>Create Your First Journey</Button>
              </Link>
            </div>
          ) : (
            filteredJourneys.map((journey: { id: string; title: string; description: string; tags: string; voteCount: number; viewCount: number; commentCount: number; createdAt: string; author: { id: string; name: string | null; image: string | null }; award?: { type: string; rank: number } | null }) => (
              <div key={journey.id} className="relative group">
                <JourneyCard journey={journey} />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Link href={`/journeys/${journey.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteModal({ isOpen: true, type: "journey", id: journey.id, title: journey.title })}
                    disabled={deletingId === journey.id}
                  >
                    {deletingId === journey.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "oneshots" && (
        <div className="grid gap-4 md:grid-cols-2">
          {loadingOneShots ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))
          ) : filteredOneShots.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-zinc-500">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No one-shots yet</p>
              <p className="text-sm mb-4">Share your best prompts with the community!</p>
              <Link href="/one-shots/new">
                <Button>Create Your First One-Shot</Button>
              </Link>
            </div>
          ) : (
            filteredOneShots.map((oneShot: { id: string; title: string; prompt: string; result?: string | null; category: string; copyCount: number; author: { id?: string; name: string | null; image?: string | null } }) => (
              <div key={oneShot.id} className="relative group">
                <OneShotCard oneShot={oneShot} />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteModal({ isOpen: true, type: "oneshot", id: oneShot.id, title: oneShot.title })}
                    disabled={deletingId === oneShot.id}
                  >
                    {deletingId === oneShot.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "drafts" && (
        <div className="space-y-4">
          {loadingDrafts ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No drafts</p>
              <p className="text-sm">Your unpublished journeys will appear here</p>
            </div>
          ) : (
            filteredDrafts.map((draft: { id: string; title: string; description: string; updatedAt: string }) => (
              <div key={draft.id} className="relative group p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="text-xs text-amber-400 font-medium mb-1 block">Draft</span>
                    <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                      {draft.title || "Untitled Journey"}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {draft.description || "No description yet"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                      Last edited: {new Date(draft.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/journeys/${draft.id}/edit`}>
                      <Button variant="secondary" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Continue
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteModal({ isOpen: true, type: "journey", id: draft.id, title: draft.title || "Untitled Journey" })}
                      disabled={deletingId === draft.id}
                    >
                      {deletingId === draft.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal?.isOpen || false}
        onClose={() => setDeleteModal(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleteModal?.type === "journey" ? "Journey" : "One-Shot"}?`}
        message={<>Are you sure you want to delete <strong>&quot;{deleteModal?.title}&quot;</strong>? This action cannot be undone.</>}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deletingId !== null}
      />
    </div>
  );
}
