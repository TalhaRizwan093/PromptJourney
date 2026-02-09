"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  content: string;
  maxLength?: number;
  className?: string;
}

/**
 * Lightweight markdown preview for import results.
 * Renders markdown as formatted HTML with Tailwind prose-like styles.
 */
export function MarkdownPreview({ content, maxLength = 300, className = "" }: MarkdownPreviewProps) {
  const truncated = maxLength && content.length > maxLength
    ? content.substring(0, maxLength) + "..."
    : content;

  return (
    <div className={`markdown-preview ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Style overrides for compact preview
          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
          h1: ({ children }) => <p className="font-bold text-zinc-200 mb-1">{children}</p>,
          h2: ({ children }) => <p className="font-bold text-zinc-200 mb-1">{children}</p>,
          h3: ({ children }) => <p className="font-semibold text-zinc-300 mb-1">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside ml-2 mb-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside ml-2 mb-1">{children}</ol>,
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-zinc-800 rounded px-2 py-1 text-[10px] overflow-x-auto my-1">
                  <code>{children}</code>
                </pre>
              );
            }
            return <code className="bg-zinc-800 rounded px-1 py-0.5 text-[10px]">{children}</code>;
          },
          pre: ({ children }) => <>{children}</>,
          strong: ({ children }) => <strong className="font-semibold text-zinc-200">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a href={href} className="text-violet-400 underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-zinc-600 pl-2 italic text-zinc-500 my-1">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <table className="text-[10px] border-collapse my-1">{children}</table>
          ),
          th: ({ children }) => (
            <th className="border border-zinc-700 px-1 py-0.5 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-zinc-700 px-1 py-0.5">{children}</td>
          ),
        }}
      >
        {truncated}
      </ReactMarkdown>
    </div>
  );
}
