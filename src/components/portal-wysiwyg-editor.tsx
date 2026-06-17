"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Image as ImageIcon, Quote } from "lucide-react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { Node } from "@tiptap/core";
import { parseMarkdown } from "@/lib/portal-utils";

// ── Markdown serialiser ─────────────────────────────────────────────────────

function imageMarkdown(attrs: any): string {
  const { src, alt, title, width } = attrs ?? {};
  const mods: string[] = [];
  const align = title || "center";
  if (align !== "center") mods.push(align);
  if (width) mods.push(String(width));
  return `![${alt ?? ""}${mods.length ? "|" + mods.join("|") : ""}](${src})`;
}

function serializeInline(node: any): string {
  if (node.type === "hardBreak") return "\n";
  if (node.type === "text") {
    let t: string = node.text ?? "";
    const marks: any[] = node.marks ?? [];
    const hasMark = (type: string) => marks.some((m: any) => m.type === type);
    const getMark = (type: string) => marks.find((m: any) => m.type === type);
    if (hasMark("code")) return `\`${t}\``;
    if (hasMark("bold")) t = `**${t}**`;
    if (hasMark("italic")) t = `*${t}*`;
    const link = getMark("link");
    if (link) t = `[${t}](${link.attrs.href})`;
    return t;
  }
  if (node.type === "image") return imageMarkdown(node.attrs);
  return (node.content ?? []).map(serializeInline).join("");
}

function serializeNode(node: any): string {
  const children = node.content ?? [];
  switch (node.type) {
    case "doc":
      return children.map((n: any) => serializeNode(n)).join("\n\n").trim();
    case "paragraph":
      return children.map(serializeInline).join("");
    case "heading": {
      const level = node.attrs?.level ?? 2;
      return "#".repeat(level) + " " + children.map(serializeInline).join("");
    }
    case "bulletList":
      return children.map((li: any) => "- " + serializeListItem(li)).join("\n");
    case "orderedList":
      return children.map((li: any, i: number) => `${i + 1}. ` + serializeListItem(li)).join("\n");
    case "listItem":
      return serializeListItem(node);
    case "blockquote":
      return children.map((n: any) => "> " + serializeNode(n)).join("\n");
    case "codeBlock": {
      const lang = node.attrs?.language ?? "";
      const code = children.map((n: any) => n.text ?? "").join("");
      return "```" + lang + "\n" + code + "\n```";
    }
    case "horizontalRule":
      return "---";
    case "image":
      return imageMarkdown(node.attrs);
    case "table":
      return serializeTable(node);
    case "rawHtml":
      return node.attrs?.html ?? "";
    default:
      return children.map((n: any) => serializeNode(n)).join("");
  }
}

function serializeListItem(node: any): string {
  return (node.content ?? []).map((n: any) => serializeNode(n)).join("\n");
}

function serializeTable(node: any): string {
  const rows: any[] = node.content ?? [];
  const lines: string[] = [];
  rows.forEach((row: any, ri: number) => {
    const cells = (row.content ?? []).map((cell: any) =>
      (cell.content ?? []).map((n: any) => serializeNode(n)).join("").replace(/\|/g, "\\|")
    );
    lines.push("| " + cells.join(" | ") + " |");
    if (ri === 0) lines.push("| " + cells.map(() => "---").join(" | ") + " |");
  });
  return lines.join("\n");
}

export function tiptapToMarkdown(json: any): string {
  if (!json) return "";
  return serializeNode(json);
}

// ── Image с возможностью изменения размера мышкой (как в Word) ───────────────

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const s = (el.style && el.style.width) || el.getAttribute("width") || "";
          return s || null;
        },
        renderHTML: (attrs: any) =>
          attrs.width ? { style: `width:${attrs.width};max-width:100%` } : {},
      },
    };
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement("span");
      wrapper.className = "wysiwyg-img-wrap";

      const img = document.createElement("img");
      img.src = node.attrs.src;
      if (node.attrs.alt) img.alt = node.attrs.alt;
      img.className = "markdown-img";
      const applyWidth = (w: string | null) => {
        if (w) {
          img.style.width = w;
          img.style.maxWidth = "100%";
        } else {
          img.style.width = "";
        }
      };
      applyWidth(node.attrs.width);
      wrapper.appendChild(img);

      const handle = document.createElement("span");
      handle.className = "md-resize-handle";
      wrapper.appendChild(handle);

      let startX = 0;
      let startW = 0;
      let dragging = false;

      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const next = Math.max(60, startW + (e.clientX - startX));
        img.style.width = `${Math.round(next)}px`;
        img.style.maxWidth = "100%";
      };
      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const parentW = wrapper.parentElement?.clientWidth || img.naturalWidth || img.offsetWidth;
        const pct = Math.max(10, Math.min(100, Math.round((img.offsetWidth / parentW) * 100)));
        const pos = typeof getPos === "function" ? getPos() : undefined;
        if (typeof pos === "number") {
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, width: `${pct}%` });
              return true;
            })
            .run();
        }
      };
      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        startX = e.clientX;
        startW = img.offsetWidth;
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      });

      return {
        dom: wrapper,
        update: (updatedNode: any) => {
          if (updatedNode.type.name !== "image") return false;
          img.src = updatedNode.attrs.src;
          img.alt = updatedNode.attrs.alt || "";
          applyWidth(updatedNode.attrs.width);
          return true;
        },
      };
    };
  },
});

// ── Raw HTML Node (for videos, formulas, mermaid) ─────────────────────────

const RawHtmlNode = Node.create({
  name: "rawHtml",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return { html: { default: "" }, label: { default: "" } };
  },
  parseHTML() {
    return [
      { tag: "div[data-raw-html]" },
      { tag: "div.katex-block" },
      { tag: "div.markdown-video-wrap" },
      { tag: "pre.mermaid" },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-raw-html": "1", class: "wysiwyg-raw-block" }, HTMLAttributes.label || "Специальный блок"];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "wysiwyg-raw-block";
      dom.setAttribute("data-raw-html", "1");
      dom.innerHTML = node.attrs.html || node.attrs.label || "Блок";
      return { dom };
    };
  },
});

// ── Toolbar ────────────────────────────────────────────────────────────────

const BTN = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; title: string }
) => {
  const { active, title, children, ...rest } = props;
  return (
    <button
      {...rest}
      title={title}
      type="button"
      style={{
        padding: "5px 9px",
        border: "none",
        borderRadius: 6,
        background: active ? "var(--clay)" : "transparent",
        color: active ? "#fff" : "var(--ink)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {children}
    </button>
  );
};

const Sep = () => (
  <div style={{ width: 1, height: 20, background: "var(--line)", margin: "0 4px", alignSelf: "center" }} />
);

function Toolbar({
  editor,
  onInsertImage,
  onInsertVideo,
}: {
  editor: Editor;
  onInsertImage: () => void;
  onInsertVideo: () => void;
}) {
  const is = (name: string, attrs?: Record<string, any>) => editor.isActive(name, attrs);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        padding: "8px 10px",
        borderBottom: "1px solid var(--line)",
        background: "var(--paper)",
        alignItems: "center",
      }}
    >
      <BTN title="Заголовок 2" active={is("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</BTN>
      <BTN title="Заголовок 3" active={is("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</BTN>
      <BTN title="Заголовок 4" active={is("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>H4</BTN>
      <Sep />
      <BTN title="Жирный (Ctrl+B)" active={is("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><strong>Ж</strong></BTN>
      <BTN title="Курсив (Ctrl+I)" active={is("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><em>К</em></BTN>
      <BTN title="Код" active={is("code")} onClick={() => editor.chain().focus().toggleCode().run()}>{"</>"}</BTN>
      <Sep />
      <BTN title="Маркированный список" active={is("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>≡•</BTN>
      <BTN title="Нумерованный список" active={is("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</BTN>
      <Sep />
      <BTN title="Цитата" active={is("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} strokeWidth={1.8} /></BTN>
      <BTN title="Горизонтальная линия" onClick={() => editor.chain().focus().setHorizontalRule().run()}>─</BTN>
      <Sep />
      <BTN title="Вставить таблицу" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>⊞ Таблица</BTN>
      <Sep />
      <BTN title="Вставить фото" onClick={onInsertImage}><ImageIcon size={14} strokeWidth={1.8} /> Фото</BTN>
      <BTN title="Вставить видео" onClick={onInsertVideo}>▶ Видео</BTN>
      <Sep />
      <BTN title="Отменить (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>↩</BTN>
      <BTN title="Вернуть (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>↪</BTN>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface WysiwygEditorProps {
  value: string; // markdown
  onChange: (markdown: string) => void;
  onInsertImage: () => void;
  onInsertVideo: () => void;
  minHeight?: number;
}

export function WysiwygEditor({ value, onChange, onInsertImage, onInsertVideo, minHeight = 260 }: WysiwygEditorProps) {
  // Последний markdown, который МЫ сами сгенерировали из редактора.
  // Если входящее value совпадает с ним — значит изменение пришло от нас,
  // и перезаписывать контент редактора не нужно (иначе сбивается курсор/правки).
  const lastEmitted = useRef<string | null>(null);

  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      const md = tiptapToMarkdown(editor.getJSON());
      lastEmitted.current = md;
      onChange(md);
    },
    [onChange]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] } }),
      ResizableImage.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: "markdown-img" } }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      RawHtmlNode,
    ],
    content: parseMarkdown(value),
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: "wysiwyg-content markdown-body",
        style: `min-height:${minHeight}px; padding:20px 24px; outline:none;`,
      },
    },
  });

  // Внешнее изменение value (загрузка материала, переключение, программная вставка)
  // → обновляем содержимое. Своё собственное изменение игнорируем.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value === lastEmitted.current) return;
    editor.commands.setContent(parseMarkdown(value));
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--paper)",
      }}
    >
      <Toolbar editor={editor} onInsertImage={onInsertImage} onInsertVideo={onInsertVideo} />
      <EditorContent editor={editor} />
    </div>
  );
}
