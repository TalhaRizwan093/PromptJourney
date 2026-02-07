"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileText,
  ClipboardPaste,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Link2,
} from "lucide-react";
import Link from "next/link";

interface ImportedStep {
  id: string;
  title: string;
  prompt: string;
  result: string;
  notes: string;
}

type Tab = "url" | "upload" | "paste";

export default function ImportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("url");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  // Result state
  const [importResult, setImportResult] = useState<{
    title: string;
    description?: string;
    steps: ImportedStep[];
    platform?: string;
    confidence?: number;
    source?: string;
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/chatgpt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setImportResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePaste = async () => {
    if (!pasteText.trim()) {
      setError("Please paste some conversation text");
      return;
    }

    setIsLoading(true);
    setError("");
    setImportResult(null);

    try {
      const res = await fetch("/api/import/paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setImportResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJourney = () => {
    if (!importResult) return;
    // Store in sessionStorage and redirect to new journey page
    sessionStorage.setItem("importedJourney", JSON.stringify(importResult));
    router.push("/journeys/new?from=import");
  };

  const handleUrlImport = async () => {
    if (!shareUrl.trim()) {
      setError("Please enter a share link");
      return;
    }

    setIsLoading(true);
    setError("");
    setImportResult(null);

    try {
      const res = await fetch("/api/import/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: shareUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setImportResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import from URL");
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
        <p className="text-zinc-400 mb-6">You need to sign in to import conversations.</p>
        <Link href="/login">
          <Button variant="glow">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/journeys">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Upload className="h-6 w-6 text-violet-400" />
            Import Conversation
          </h1>
          <p className="text-sm text-zinc-400">
            Turn your AI conversations into shareable journeys
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={activeTab === "url" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("url");
            setError("");
            setImportResult(null);
          }}
          className="gap-2"
        >
          <Link2 className="h-4 w-4" />
          Share Link
        </Button>
        <Button
          variant={activeTab === "paste" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("paste");
            setError("");
            setImportResult(null);
          }}
          className="gap-2"
        >
          <ClipboardPaste className="h-4 w-4" />
          Paste Conversation
        </Button>
        <Button
          variant={activeTab === "upload" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("upload");
            setError("");
            setImportResult(null);
          }}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Upload Export File
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="whitespace-pre-line">{error}</span>
        </div>
      )}

      {/* URL Tab */}
      {activeTab === "url" && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import from Share Link</CardTitle>
            <p className="text-sm text-zinc-400">
              Paste a shared conversation link from ChatGPT, Claude, or Gemini.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Input
                value={shareUrl}
                onChange={(e) => setShareUrl(e.target.value)}
                placeholder="https://chatgpt.com/share/... or https://claude.ai/share/..."
                className="font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUrlImport();
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-zinc-500">
                  Supports ChatGPT, Claude & Gemini share links
                </p>
                <Button onClick={handleUrlImport} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-800/50 space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">How to get share links:</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-violet-400">ChatGPT</p>
                  <ol className="text-xs text-zinc-400 space-y-0.5 list-decimal list-inside">
                    <li>Open any conversation</li>
                    <li>Click share icon (top right)</li>
                    <li>Click &quot;Copy Link&quot;</li>
                  </ol>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-orange-400">Claude</p>
                  <ol className="text-xs text-zinc-400 space-y-0.5 list-decimal list-inside">
                    <li>Open any conversation</li>
                    <li>Click share icon</li>
                    <li>Click &quot;Create share link&quot;</li>
                  </ol>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-400">Gemini</p>
                  <ol className="text-xs text-zinc-400 space-y-0.5 list-decimal list-inside">
                    <li>Open any conversation</li>
                    <li>Click &quot;Share&quot; button</li>
                    <li>Click &quot;Create public link&quot;</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paste Tab */}
      {activeTab === "paste" && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paste Your Conversation</CardTitle>
            <p className="text-sm text-zinc-400">
              Paste a conversation from ChatGPT, Claude, Copilot, or any AI.
              We&apos;ll auto-detect the format.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Paste your conversation here...\n\nExample format:\nUser: How do I create a React component?\nAssistant: Here's how you create a React component...\n\nUser: Can you add TypeScript?\nAssistant: Sure! Here's the TypeScript version...`}
              rows={16}
              className="font-mono text-sm"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-500">
                Supports: ChatGPT, Claude, Copilot, Gemini formats
              </p>
              <Button onClick={handlePaste} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Parse Conversation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Tab */}
      {activeTab === "upload" && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload ChatGPT Export</CardTitle>
            <p className="text-sm text-zinc-400">
              Go to ChatGPT → Settings → Data Controls → Export Data. Upload the
              chat.html or conversations.json file.
            </p>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-zinc-700 rounded-xl p-12 text-center cursor-pointer hover:border-violet-500/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              {isLoading ? (
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-violet-400" />
              ) : (
                <Upload className="h-12 w-12 mx-auto mb-4 text-zinc-500" />
              )}
              <p className="text-zinc-300 mb-2">
                {isLoading ? "Parsing file..." : "Click to upload or drag & drop"}
              </p>
              <p className="text-xs text-zinc-500">
                Accepts .html, .htm, .json files (max 10MB)
              </p>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-zinc-800/50 space-y-2">
              <h3 className="text-sm font-medium text-zinc-300">How to export from ChatGPT:</h3>
              <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
                <li>Open ChatGPT → Click your profile icon</li>
                <li>Go to Settings → Data Controls</li>
                <li>Click &quot;Export Data&quot; → Confirm</li>
                <li>Download the zip file from your email</li>
                <li>Extract and upload the chat.html file here</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result Preview */}
      {importResult && (
        <div className="space-y-6">
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      Successfully parsed {importResult.steps.length} steps
                    </p>
                    {importResult.platform && (
                      <p className="text-xs text-zinc-400">
                        Detected platform: {importResult.platform}
                        {importResult.confidence
                          ? ` (${Math.round(importResult.confidence * 100)}% confidence)`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
                <Button onClick={handleCreateJourney} className="gap-2">
                  Create Journey
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-lg font-semibold text-zinc-100">
            {importResult.title}
          </h2>

          {/* Preview Steps */}
          <div className="space-y-3">
            {importResult.steps.map((step, idx) => (
              <Card key={step.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-sm font-medium text-zinc-200">
                        {step.title}
                      </p>
                      <div className="text-xs text-zinc-400">
                        <span className="text-violet-400 font-medium">Prompt: </span>
                        {step.prompt.substring(0, 200)}
                        {step.prompt.length > 200 ? "..." : ""}
                      </div>
                      {step.result && (
                        <div className="text-xs text-zinc-500">
                          <span className="text-emerald-400 font-medium">Response: </span>
                          {step.result.substring(0, 200)}
                          {step.result.length > 200 ? "..." : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setImportResult(null)}
            >
              Start Over
            </Button>
            <Button onClick={handleCreateJourney} className="gap-2">
              Create Journey from Import
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
