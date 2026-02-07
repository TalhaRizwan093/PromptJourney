"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Heading1,
  Heading2,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  Strikethrough,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-violet-500/20 text-violet-300"
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Convert to base64 data URL for inline embedding
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        editor.chain().focus().setImage({ src: dataUrl }).run();
      };
      reader.readAsDataURL(file);

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [editor]
  );

  const addImageFromUrl = useCallback(() => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  return (
    <div className="flex items-center gap-0.5 p-2 border-b border-zinc-700 bg-zinc-800/50 flex-wrap">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFile}
        className="hidden"
      />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        isActive={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title="Code Block"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <ToolbarButton onClick={setLink} isActive={editor.isActive("link")} title="Link">
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton onClick={addImage} title="Upload Image">
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs text-zinc-400"
        onClick={addImageFromUrl}
        title="Image from URL"
      >
        URL
      </Button>

      <div className="flex-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  minHeight = "200px",
  className,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({
        HTMLAttributes: { class: "max-w-full rounded-lg my-2" },
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-violet-400 hover:underline cursor-pointer" },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "outline-none min-h-[inherit] px-4 py-3",
        style: `min-height: ${minHeight}`,
      },
      handlePaste: (view, event) => {
        // Handle pasted images
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;

            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: dataUrl })
                )
              );
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        // Handle dropped images
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        for (const file of Array.from(files)) {
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const { tr } = view.state;
              const pos = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });
              if (pos) {
                view.dispatch(
                  tr.insert(
                    pos.pos,
                    view.state.schema.nodes.image.create({ src: dataUrl })
                  )
                );
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML() && value !== undefined) {
      // Only update if the external value actually differs
      const currentHtml = editor.getHTML();
      // Avoid re-setting if the content is effectively the same
      if (value === "" && currentHtml === "<p></p>") return;
      if (value !== currentHtml) {
        editor.commands.setContent(value || "", { emitUpdate: false });
      }
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900/50 animate-pulse",
          className
        )}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div
      className={cn(
        "border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900/50",
        className
      )}
    >
      <Toolbar editor={editor} />
      <div
        className="prose prose-invert max-w-none text-zinc-300
          prose-headings:text-zinc-100 prose-p:text-zinc-300
          prose-a:text-violet-400 prose-strong:text-zinc-100
          prose-code:text-violet-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-zinc-800 prose-pre:rounded-lg
          prose-blockquote:border-violet-500 prose-blockquote:text-zinc-400
          prose-img:rounded-lg prose-img:max-w-full
          [&_.ProseMirror]:outline-none
          [&_.tiptap_p.is-editor-empty:first-child::before]:text-zinc-500
          [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.tiptap_p.is-editor-empty:first-child::before]:float-left
          [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.tiptap_p.is-editor-empty:first-child::before]:h-0"
      >
        <EditorContent editor={editor} />
      </div>

      <div className="px-3 py-2 border-t border-zinc-700 bg-zinc-800/30 text-xs text-zinc-500">
        Rich text editor • Paste or drop images directly • Ctrl+B bold • Ctrl+I italic
      </div>
    </div>
  );
}
