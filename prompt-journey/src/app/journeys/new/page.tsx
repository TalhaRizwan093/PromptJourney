"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  X,
  GripVertical,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { RichEditor } from "@/components/ui/rich-editor";

interface JourneyStep {
  id: string;
  title: string;
  prompt: string;
  result: string;
  notes: string;
}

function NewJourneyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [steps, setSteps] = useState<JourneyStep[]>([
    { id: "1", title: "", prompt: "", result: "", notes: "" },
  ]);
  const [importLoaded, setImportLoaded] = useState(false);

  // Load imported data from sessionStorage if redirected from import page
  useEffect(() => {
    if (searchParams.get("from") === "import" && !importLoaded) {
      try {
        const raw = sessionStorage.getItem("importedJourney");
        if (raw) {
          const data = JSON.parse(raw);
          if (data.title) setTitle(data.title);
          if (data.description) setDescription(data.description);
          if (data.steps?.length) setSteps(data.steps);
          sessionStorage.removeItem("importedJourney");
          setImportLoaded(true);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [searchParams, importLoaded]);

  const addStep = () => {
    setSteps([
      ...steps,
      { id: Date.now().toString(), title: "", prompt: "", result: "", notes: "" },
    ]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter((step) => step.id !== id));
    }
  };

  const updateStep = (id: string, field: keyof JourneyStep, value: string) => {
    setSteps(
      steps.map((step) =>
        step.id === id ? { ...step, [field]: value } : step
      )
    );
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (publish: boolean = false) => {
    if (!session) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          content: JSON.stringify(steps),
          tags: tags.join(","),
          published: publish,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create journey");
      }

      const journey = await res.json();
      router.push(`/journeys/${journey.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

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
        <Sparkles className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Sign In Required</h1>
        <p className="text-zinc-400 mb-6">You need to be signed in to create a journey.</p>
        <Link href="/login">
          <Button variant="glow">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/journeys">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-violet-400" />
              New Journey
            </h1>
            <p className="text-sm text-zinc-400">Document your AI adventure</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/import">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </Link>
          <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => handleSubmit(true)} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Main Form */}
      <div className="space-y-6">
        {/* Title & Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Journey Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Building a SaaS App with Claude"
                className="text-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief overview of what you accomplished and how..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Add tags (press Enter)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Journey Steps */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Journey Steps</h2>
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          {steps.map((step, index) => (
            <Card key={step.id} className="relative">
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-zinc-600 cursor-grab" />
                <span className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
              </div>
              {steps.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-zinc-500 hover:text-red-400"
                  onClick={() => removeStep(step.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <CardContent className="pt-16 space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Step Title
                  </label>
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(step.id, "title", e.target.value)}
                    placeholder="e.g., Setting up the database schema"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Prompt Used
                  </label>
                  <Textarea
                    value={step.prompt}
                    onChange={(e) => updateStep(step.id, "prompt", e.target.value)}
                    placeholder="Paste the prompt you used..."
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Result / Output
                  </label>
                  <RichEditor
                    value={step.result}
                    onChange={(val) => updateStep(step.id, "result", val)}
                    placeholder="What was the result? Include code, images, tables..."
                    minHeight="150px"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Notes & Learnings
                  </label>
                  <RichEditor
                    value={step.notes}
                    onChange={(val) => updateStep(step.id, "notes", val)}
                    placeholder="Any notes, lessons learned, or tips for others..."
                    minHeight="100px"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full" onClick={addStep}>
            <Plus className="h-4 w-4 mr-2" />
            Add Another Step
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewJourneyPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      }
    >
      <NewJourneyContent />
    </Suspense>
  );
}
