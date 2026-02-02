"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  ArrowLeft,
  Send,
  Loader2,
  Code,
  Pencil,
  Palette,
  Briefcase,
  GraduationCap,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

const categories = [
  { value: "Coding", icon: Code },
  { value: "Writing", icon: Pencil },
  { value: "Design", icon: Palette },
  { value: "Business", icon: Briefcase },
  { value: "Education", icon: GraduationCap },
  { value: "Marketing", icon: Megaphone },
];

export default function NewOneShotPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    prompt: "",
    result: "",
    category: "Coding",
  });

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Zap className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Sign In Required</h1>
        <p className="text-zinc-400 mb-6">You need to be signed in to submit a prompt.</p>
        <Link href="/login">
          <Button variant="glow">Sign In</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/one-shots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create prompt");
      }

      router.push("/one-shots");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/one-shots" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-100 mb-6 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to One-Shots
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-cyan-500/20 to-violet-500/20">
              <Zap className="h-6 w-6 text-cyan-400" />
            </div>
            Submit a One-Shot Prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Title</label>
              <Input
                placeholder="e.g., Code Review Assistant"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = formData.category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.value })}
                      className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                          : "text-zinc-400 hover:text-zinc-100 bg-zinc-800/50 border border-zinc-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {cat.value}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Prompt</label>
              <Textarea
                placeholder="Enter your prompt template. Use [PLACEHOLDER] for variables..."
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                rows={8}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-zinc-500">
                Use [BRACKETS] to indicate parts users should customize
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Example Result (Optional)</label>
              <Textarea
                placeholder="Describe what kind of output this prompt typically generates..."
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Prompt
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
