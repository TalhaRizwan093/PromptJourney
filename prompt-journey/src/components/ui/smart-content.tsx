"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SmartContentProps {
  content: string;
  className?: string;
}

/**
 * Detects whether content is HTML (from TipTap rich editor) or plain markdown
 * (from URL imports / manual text) and renders accordingly.
 *
 * - HTML content → rendered via dangerouslySetInnerHTML with prose styling
 * - Markdown content → rendered via react-markdown
 */
export function SmartContent({ content, className = "" }: SmartContentProps) {
  if (!content) return null;

  if (isHtml(content)) {
    return (
      <div
        className={`prose prose-invert prose-sm max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          h1: ({ children }) => <h2 className="text-lg font-bold text-zinc-100 mt-4 mb-2">{children}</h2>,
          h2: ({ children }) => <h3 className="text-base font-bold text-zinc-100 mt-3 mb-2">{children}</h3>,
          h3: ({ children }) => <h4 className="text-sm font-semibold text-zinc-200 mt-3 mb-1">{children}</h4>,
          h4: ({ children }) => <h5 className="text-sm font-medium text-zinc-300 mt-2 mb-1">{children}</h5>,
          ul: ({ children }) => <ul className="list-disc list-outside ml-5 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-5 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-zinc-300">{children}</li>,
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-xs overflow-x-auto my-3">
                  <code className="text-zinc-300">{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-zinc-800 rounded px-1.5 py-0.5 text-xs text-violet-300 font-mono">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
          em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-violet-400 hover:text-violet-300 underline decoration-violet-400/30"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-violet-500/40 pl-3 italic text-zinc-400 my-2">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-zinc-700 my-4" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="text-sm border-collapse w-full">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-800/50">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-zinc-700 px-3 py-1.5 text-left font-semibold text-zinc-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-zinc-700 px-3 py-1.5 text-zinc-300">{children}</td>
          ),
          img: ({ src, alt }) => (
            <img src={src} alt={alt || ""} className="rounded-lg max-w-full my-2" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** Simple heuristic: if content contains common HTML tags, treat it as HTML from TipTap. */
function isHtml(text: string): boolean {
  // Check for common TipTap output tags
  return /<(?:p|h[1-6]|div|ul|ol|li|strong|em|a |br|img |blockquote|pre|code|table|tr|td|th)[\s>/]/i.test(text);
}
