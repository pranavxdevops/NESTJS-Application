"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Strike from "@tiptap/extension-strike";
import Blockquote from "@tiptap/extension-blockquote";
import Placeholder from "@tiptap/extension-placeholder";

import {
  Bold, Italic, Strikethrough, Link2, List, ListOrdered,
  Quote, Undo2, Redo2, ChevronDown
} from "lucide-react";
import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { strapi } from "@/lib/strapi";


// Expose clear() and setContent() methods to parent
export interface StrapiRichTextEditorRef {
  clear: () => void;
  setContent: (html: string) => void;
}

interface StrapiRichTextEditorProps {
  initialContent?: string;
  onSave?: (html: string) => void;
  storageKey?: string;
  disabled?: boolean;
}

const StrapiRichTextEditor = forwardRef<StrapiRichTextEditorRef, StrapiRichTextEditorProps>(
  ({ initialContent = "", onSave, storageKey = "strapi-content", disabled = false }, ref) => {
    const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
    const [currentLevel, setCurrentLevel] = useState<number | null>(null);

    const editor = useEditor({
      immediatelyRender: false,
      editable: !disabled,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4, 5, 6] },
          strike: false,
        }),
        Link.configure({ openOnClick: false, autolink: true }),
        Strike,
        Blockquote,
        Placeholder.configure({ placeholder: "Write something…" }),
      ],
      content: initialContent,
      editorProps: {
        attributes: {
          class: `prose prose-editor max-w-none focus:outline-none min-h-[400px] pt-5 pb-12 px-6 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
        },
      },
      onCreate: ({ editor }) => {
        // Optional: make sure it's really set after creation
        if (initialContent) {
          editor.commands.setContent(initialContent);
        }
      },
    });

    // Expose clear() and setContent() to parent
    useImperativeHandle(ref, () => ({
      clear: () => {
        editor?.commands.clearContent();
        localStorage.removeItem(storageKey);
      },
      setContent: (html: string) => {
        editor?.commands.setContent(html);
      },
    }));

    // Auto-save to parent + localStorage
    useEffect(() => {
      if (!editor) return;

      const save = () => {
        const html = editor.getHTML();
        onSave?.(html);
        localStorage.setItem(storageKey, html);
      };

      editor.on("update", save);
      editor.on("blur", save);

      // Load from localStorage if no initialContent
      if (!initialContent) {
        const saved = localStorage.getItem(storageKey);
        if (saved && saved !== "<p></p>") {
          editor.commands.setContent(saved);
        }
      }

      return () => {
        editor.off("update", save);
        editor.off("blur", save);
      };
    }, [editor, onSave, initialContent, storageKey]);

    // Heading detection
    useEffect(() => {
      if (!editor) return;
      const update = () => {
        const { from, to } = editor.state.selection;
        let level: number | null = null;
        editor.state.doc.nodesBetween(from, to, (node) => {
          if (node.type.name === "heading") {
            level = node.attrs.level;
            return false;
          }
        });
        setCurrentLevel(level);
      };
      update();
      editor.on("selectionUpdate", update);
      editor.on("update", update);
      return () => {
        editor.off("selectionUpdate", update);
        editor.off("update", update);
      };
    }, [editor]);

    // Image Upload – same as your cover image


    const setLink = useCallback(() => {
      const url = window.prompt("URL", editor?.getAttributes("link").href || "https://");
      if (url === null) return;
      if (url === "") editor?.chain().focus().unsetLink().run();
      else editor?.chain().focus().setLink({ href: url }).run();
    }, [editor]);



    const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (!value) editor?.chain().focus().setParagraph().run();
      else editor?.chain().focus().setHeading({ level: Number(value) as any }).run();
    };

    const fixImageUrls = (html: string) =>
      html.replace(/src="\/uploads\//g, `src="${strapi.url}/uploads/`);

    if (!editor) {
      return <div className="border border-gray-300 rounded-lg p-10 text-center text-gray-500">Loading editor...</div>;
    }

    return (
      <>
        <link href="https://rsms.me/inter/inter.css" rel="stylesheet" />

        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg font-source">
          {/* Tabs */}
          <div className="flex border-b bg-gray-50">
            {["write", "preview"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-700 bg-white"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          {activeTab === "write" && (
            <div className={`bg-gray-50 border-b px-4 py-3 flex items-center gap-2 flex-wrap ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Heading */}
              <div className="relative">
                <select
                  value={currentLevel ?? ""}
                  onChange={handleHeadingChange}
                  disabled={disabled}
                  className="appearance-none bg-white border border-gray-400 rounded px-4 py-2 pr-10 font-medium text-sm cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Paragraph</option>
                  {[1, 2, 3, 4, 5, 6].map((l) => (
                    <option key={l} value={l}>Heading {l}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-3 pointer-events-none text-gray-500" />
              </div>

              <div className="w-px h-8 bg-gray-400 mx-2" />

              {/* Formatting */}
              {[
                { Icon: Bold, cmd: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
                { Icon: Italic, cmd: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
                { Icon: Strikethrough, cmd: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
                { Icon: Link2, cmd: setLink, active: editor.isActive("link") },
                { Icon: List, cmd: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
                { Icon: ListOrdered, cmd: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
              ].map(({ Icon, cmd, active }, i) => (
                <button key={i} onClick={cmd} disabled={disabled} className={`p-2.5 rounded hover:bg-white transition ${active ? "bg-white shadow-sm border" : ""} ${disabled ? 'cursor-not-allowed' : ''}`}>
                  <Icon className="w-5 h-5" />
                </button>
              ))}

              <button onClick={() => editor.chain().focus().toggleBlockquote().run()} disabled={disabled} className={`p-2.5 rounded hover:bg-white transition ${editor.isActive("blockquote") ? "bg-white shadow-sm border" : ""} ${disabled ? 'cursor-not-allowed' : ''}`}>
                <Quote className="w-5 h-5" />
              </button>

              <div className="flex-1" />

              <button onClick={() => editor.chain().focus().undo().run()} disabled={disabled || !editor.can().undo()} className="p-2.5 rounded hover:bg-white disabled:opacity-40">
                <Undo2 className="w-5 h-5" />
              </button>
              <button onClick={() => editor.chain().focus().redo().run()} disabled={disabled || !editor.can().redo()} className="p-2.5 rounded hover:bg-white disabled:opacity-40">
                <Redo2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Editor / Preview */}
          <div className="bg-white min-h-[400px]">
            {activeTab === "write" ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="pt-5 pb-12 px-6 prose prose-editor max-w-none">
                {editor.getHTML() ? (
                  <div dangerouslySetInnerHTML={{ __html: fixImageUrls(editor.getHTML()) }} />
                ) : (
                  <p className="text-gray-500">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
);

StrapiRichTextEditor.displayName = "StrapiRichTextEditor";

export default StrapiRichTextEditor;