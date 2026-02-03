"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image,
  Table,
  Quote,
  Heading1,
  Heading2,
  Eye,
  Edit,
  Copy,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

interface ToolbarButton {
  icon: LucideIcon;
  before: string;
  after: string;
  placeholderText: string;
  title: string;
}

export function RichEditor({
  value,
  onChange,
  placeholder = "Write your content here... Supports Markdown!",
  minHeight = "200px",
  className,
}: RichEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = useCallback((before: string, after: string = "", placeholderText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholderText;
    
    const newValue = 
      value.substring(0, start) + 
      before + textToInsert + after + 
      value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after insert
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const toolbarButtons: ToolbarButton[] = useMemo(() => [
    { icon: Bold, before: "**", after: "**", placeholderText: "bold text", title: "Bold (Ctrl+B)" },
    { icon: Italic, before: "*", after: "*", placeholderText: "italic text", title: "Italic (Ctrl+I)" },
    { icon: Code, before: "`", after: "`", placeholderText: "code", title: "Inline Code" },
    { icon: Heading1, before: "\n# ", after: "\n", placeholderText: "Heading 1", title: "Heading 1" },
    { icon: Heading2, before: "\n## ", after: "\n", placeholderText: "Heading 2", title: "Heading 2" },
    { icon: Quote, before: "\n> ", after: "\n", placeholderText: "quote", title: "Quote" },
    { icon: List, before: "\n- ", after: "\n", placeholderText: "list item", title: "Bullet List" },
    { icon: ListOrdered, before: "\n1. ", after: "\n", placeholderText: "list item", title: "Numbered List" },
    { icon: LinkIcon, before: "[", after: "](url)", placeholderText: "link text", title: "Link" },
    { icon: Image, before: "![", after: "](image-url)", placeholderText: "alt text", title: "Image" },
    { icon: Table, before: "\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n", after: "", placeholderText: "", title: "Table" },
  ], []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") {
        e.preventDefault();
        insertMarkdown("**", "**", "bold text");
      } else if (e.key === "i") {
        e.preventDefault();
        insertMarkdown("*", "*", "italic text");
      }
    }
    // Handle Tab for code indentation
    if (e.key === "Tab") {
      e.preventDefault();
      insertMarkdown("  ", "", "");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple markdown to HTML for preview
  const renderMarkdown = (text: string): string => {
    return text
      // Code blocks (must be before inline code)
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-zinc-800 p-4 rounded-lg overflow-x-auto my-2"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-violet-300">$1</code>')
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-zinc-100 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-zinc-100 mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-zinc-100 mt-4 mb-2">$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-100">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-violet-400 hover:underline" target="_blank" rel="noopener">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2" />')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-violet-500 pl-4 py-1 my-2 text-zinc-400 italic">$1</blockquote>')
      // Lists
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      // Tables (basic)
      .replace(/\|(.+)\|/g, (match) => {
        if (match.includes('---')) return '';
        const cells = match.split('|').filter(Boolean).map(c => c.trim());
        return `<tr>${cells.map(c => `<td class="border border-zinc-700 px-3 py-2">${c}</td>`).join('')}</tr>`;
      })
      // Line breaks
      .replace(/\n\n/g, '</p><p class="my-2">')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className={cn("border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900/50", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-zinc-700 bg-zinc-800/50 flex-wrap">
        {toolbarButtons.map((btn, i) => {
          const Icon = btn.icon;
          return (
            <Button
              key={i}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => insertMarkdown(btn.before, btn.after, btn.placeholderText)}
              title={btn.title}
              disabled={isPreview}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant={isPreview ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-3 gap-1"
          onClick={() => setIsPreview(!isPreview)}
        >
          {isPreview ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {isPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      {/* Editor / Preview */}
      {isPreview ? (
        <div 
          className="p-4 prose prose-invert max-w-none text-zinc-300"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(value)}</p>` }}
        />
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="border-0 rounded-none resize-none focus-visible:ring-0 font-mono text-sm"
          style={{ minHeight }}
        />
      )}

      {/* Footer hints */}
      <div className="px-3 py-2 border-t border-zinc-700 bg-zinc-800/30 text-xs text-zinc-500">
        Supports Markdown • **bold** • *italic* • `code` • [links](url) • ![images](url)
      </div>
    </div>
  );
}
