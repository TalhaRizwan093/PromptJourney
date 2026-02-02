import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, Zap, ExternalLink } from "lucide-react";
import { useState } from "react";

interface OneShotCardProps {
  oneShot: {
    id: string;
    title: string;
    prompt: string;
    result?: string;
    category: string;
    copyCount: number;
    author: {
      name: string;
    };
  };
}

export function OneShotCard({ oneShot }: OneShotCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(oneShot.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500" />
      
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <Badge variant="outline" className="text-xs">
              {oneShot.category}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>

        <Link href={`/one-shots/${oneShot.id}`}>
          <h3 className="font-semibold text-zinc-100 mb-2 group-hover:text-violet-300 transition-colors">
            {oneShot.title}
          </h3>
        </Link>

        <div className="relative">
          <pre className="text-sm text-zinc-400 bg-zinc-800/50 rounded-xl p-4 overflow-hidden max-h-32">
            <code className="line-clamp-4">{oneShot.prompt}</code>
          </pre>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-900 to-transparent" />
        </div>

        {oneShot.result && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Example Result
            </p>
            <p className="text-sm text-zinc-400 line-clamp-2">{oneShot.result}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
          <span className="text-xs text-zinc-500">by {oneShot.author.name}</span>
          <span className="text-xs text-zinc-500">
            {oneShot.copyCount} copies
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
