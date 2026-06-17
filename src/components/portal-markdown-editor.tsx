"use client";

import React, { useRef, useState } from "react";
import { Bot, Check } from "lucide-react";
import { useMarkdownEffects } from "@/lib/use-markdown-effects";
import { HelpModal } from "@/components/portal-help-modal";
import { WysiwygEditor } from "@/components/portal-wysiwyg-editor";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onUploadFile?: (file: File) => Promise<{ path: string }>;
  placeholder?: string;
  minHeight?: number;
};

type Tab = "edit" | "preview";
type Align = "left" | "center" | "right";

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

export function MarkdownEditor({
  value,
  onChange,
  onUploadFile,
  placeholder = "Введите текст в формате Markdown...",
  minHeight = 260,
}: Props) {
  const [tab, setTab] = useState<Tab>("edit");
  const [uploading, setUploading] = useState(false);
  const [videoDialog, setVideoDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [imageDialog, setImageDialog] = useState<{ path: string; name: string; caption: string } | null>(null);
  const [imageAlign, setImageAlign] = useState<Align>("center");
  const [helpOpen, setHelpOpen] = useState(false);
  // Interactive image editing from preview
  const [editImgDialog, setEditImgDialog] = useState<{
    idx: number; src: string; align: Align; caption: string; width: string;
  } | null>(null);
  const [editImgAlign, setEditImgAlign] = useState<Align>("center");
  const [editImgCaption, setEditImgCaption] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useMarkdownEffects(tab === "preview" ? value : null);

  function wrap(before: string, after: string, fallback: string) {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const sel = value.substring(s, e) || fallback;
    const next = value.substring(0, s) + before + sel + after + value.substring(e);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  }

  function insertBlock(tpl: string) {
    const ta = taRef.current;
    const pos = ta ? ta.selectionStart : value.length;
    const before = value.substring(0, pos);
    const after = value.substring(pos);
    const pre =
      before.length === 0 ? "" :
      before.endsWith("\n\n") ? "" :
      before.endsWith("\n") ? "\n" : "\n\n";
    const suf =
      after.length === 0 ? "" :
      after.startsWith("\n\n") ? "" :
      after.startsWith("\n") ? "\n" : "\n\n";
    onChange(before + pre + tpl + suf + after);
    const newPos = before.length + pre.length + tpl.length;
    requestAnimationFrame(() => {
      if (ta) { ta.focus(); ta.setSelectionRange(newPos, newPos); }
    });
  }

  async function handleImageUpload(file: File) {
    if (!onUploadFile) return;
    setUploading(true);
    try {
      const { path } = await onUploadFile(file);
      const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setImageAlign("center");
      setImageDialog({ path, name, caption: name });
    } catch (err) {
      console.error("Image upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  function confirmImageInsert() {
    if (!imageDialog) return;
    const { path, caption } = imageDialog;
    const syntax = imageAlign === "center"
      ? `![${caption}](${path})`
      : `![${caption}|${imageAlign}](${path})`;
    insertBlock(syntax);
    setImageDialog(null);
  }

  function buildImgSyntax(caption: string, align: Align, width: string, src: string) {
    const mods: string[] = [];
    if (align !== "center") mods.push(align);
    if (width) mods.push(width);
    return `![${caption}${mods.length ? "|" + mods.join("|") : ""}](${src})`;
  }

  function updateImage(imgIdx: number, newAlign: Align, newCaption: string, newWidth: string) {
    const lines = value.split("\n");
    let count = 0;
    const updated = lines.map((line) => {
      const m = line.trim().match(/^!\[([^\]|]*?)((?:\|[^\]|]+)*)\]\(([^)]+)\)$/);
      if (m) {
        if (count === imgIdx) {
          count++;
          return buildImgSyntax(newCaption, newAlign, newWidth, m[3]);
        }
        count++;
      }
      return line;
    }).join("\n");
    onChange(updated);
  }

  // Attach interactive handlers to images in preview:
  // — клик по фото → диалог (выравнивание/подпись)
  // — перетаскивание уголка → изменение размера, как в Word
  React.useEffect(() => {
    if (tab !== "preview" || !previewRef.current) return;
    const figures = previewRef.current.querySelectorAll<HTMLElement>("figure[data-img-idx]");
    const cleanups: (() => void)[] = [];

    figures.forEach((fig) => {
      fig.classList.add("interactive");
      const idx = parseInt(fig.getAttribute("data-img-idx") || "0", 10);
      const img = fig.querySelector("img");
      const figcaption = fig.querySelector("figcaption");
      const src = img?.getAttribute("src") || "";
      const caption = figcaption?.textContent || img?.getAttribute("alt") || "";
      const align: Align = fig.classList.contains("align-left")
        ? "left"
        : fig.classList.contains("align-right")
        ? "right"
        : "center";
      const currentWidth = (img?.style.width || "").trim();

      // Клик по фигуре (но не по ручке) — открыть диалог
      const handler = (e: Event) => {
        if ((e.target as HTMLElement)?.classList?.contains("md-resize-handle")) return;
        setEditImgAlign(align);
        setEditImgCaption(caption);
        setEditImgDialog({ idx, src, align, caption, width: currentWidth });
      };
      fig.addEventListener("click", handler);
      cleanups.push(() => fig.removeEventListener("click", handler));

      // Ручка ресайза в правом нижнем углу изображения
      if (img) {
        const handle = document.createElement("span");
        handle.className = "md-resize-handle";
        fig.appendChild(handle);

        let startX = 0;
        let startW = 0;
        let containerW = 0;
        let dragging = false;

        const onMove = (ev: PointerEvent) => {
          if (!dragging) return;
          const delta = ev.clientX - startX;
          let next = startW + delta;
          const min = 60;
          const max = containerW || startW * 3;
          next = Math.max(min, Math.min(max, next));
          img.style.width = `${Math.round(next)}px`;
          img.style.maxWidth = "100%";
        };
        const onUp = () => {
          if (!dragging) return;
          dragging = false;
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          // Переводим в проценты от контейнера и сохраняем в Markdown
          const finalW = img.offsetWidth;
          const pct = containerW > 0 ? Math.round((finalW / containerW) * 100) : 100;
          const clamped = Math.max(10, Math.min(100, pct));
          updateImage(idx, align, caption, `${clamped}%`);
        };
        const onDown = (ev: PointerEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
          dragging = true;
          startX = ev.clientX;
          startW = img.offsetWidth;
          const body = previewRef.current?.querySelector(".markdown-body") as HTMLElement | null;
          containerW = (body || previewRef.current!).clientWidth;
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        };
        handle.addEventListener("pointerdown", onDown);
        cleanups.push(() => handle.removeEventListener("pointerdown", onDown));
      }
    });
    return () => cleanups.forEach((c) => c());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, value]);

  function handleVideoInsert() {
    const url = videoUrl.trim();
    setVideoDialog(false);
    setVideoUrl("");
    if (!url) return;
    const ytId = extractYouTubeId(url);
    if (ytId) { insertBlock(`@[youtube](${ytId})`); return; }
    const viId = extractVimeoId(url);
    if (viId) { insertBlock(`@[vimeo](${viId})`); return; }
    insertBlock(`@[youtube](${url})`);
  }

  const TABLE =
    "| Колонка 1 | Колонка 2 | Колонка 3 |\n" +
    "|:----------|:---------:|----------:|\n" +
    "| Данные    | Данные    | Данные    |\n" +
    "| Данные    | Данные    | Данные    |";

  const MERMAID =
    "```mermaid\n" +
    "graph TD\n" +
    "    A[Начало] --> B{Условие?}\n" +
    "    B -->|Да| C[Результат 1]\n" +
    "    B -->|Нет| D[Результат 2]\n" +
    "```";

  type Btn = { label: string; title: string; action: () => void } | { sep: true };

  const tools: Btn[] = [
    { label: "Ж", title: "Жирный (выделите текст)", action: () => wrap("**", "**", "жирный текст") },
    { label: "К", title: "Курсив", action: () => wrap("*", "*", "курсив") },
    { sep: true },
    { label: "H2", title: "Заголовок раздела", action: () => insertBlock("## Заголовок раздела") },
    { label: "H3", title: "Подзаголовок", action: () => insertBlock("### Подзаголовок") },
    { label: "H4", title: "Мелкий заголовок", action: () => insertBlock("#### Пункт") },
    { sep: true },
    { label: "• —", title: "Маркированный список", action: () => insertBlock("- Первый пункт\n- Второй пункт\n- Третий пункт") },
    { label: "1 —", title: "Нумерованный список", action: () => insertBlock("1. Первый пункт\n2. Второй пункт\n3. Третий пункт") },
    { label: '"', title: "Цитата", action: () => insertBlock("> Важное замечание или цитата") },
    { label: "──", title: "Разделитель", action: () => insertBlock("---") },
    { sep: true },
    ...(onUploadFile
      ? [{ label: uploading ? "⏳" : "📷 Фото", title: "Загрузить и вставить фото", action: () => imgInputRef.current?.click() } as Btn]
      : []),
    { label: "▶ Видео", title: "Вставить видео YouTube / Vimeo", action: () => setVideoDialog(true) },
    { label: "⊞ Таблица", title: "Вставить таблицу", action: () => insertBlock(TABLE) },
    { label: "⎔ Диаграмма", title: "Вставить схему (Mermaid)", action: () => insertBlock(MERMAID) },
    { sep: true },
    { label: "`код`", title: "Встроенный код", action: () => wrap("`", "`", "код") },
    { label: "∑ Формула", title: "Математическая формула (LaTeX)", action: () => wrap("$", "$", "E = mc^2") },
  ];

  return (
    <div>
      {/* ── Tabs ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", gap: 2 }}>
          {([
            ["edit", "✏️ Редактор"],
            ["preview", "⊟ Визуальный"],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                fontSize: 12,
                padding: "5px 12px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: tab === key ? "var(--sand)" : "transparent",
                color: tab === key ? "var(--ink)" : "var(--muted)",
                fontWeight: tab === key ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          style={{
            fontSize: 11,
            color: "var(--muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
            borderRadius: 4,
            textDecoration: "underline dotted",
          }}
        >
          ? Справка
        </button>
      </div>

      {/* ── Edit tab ── */}
      {tab === "edit" && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
          <div className="md-toolbar" role="toolbar">
            {tools.map((t, i) =>
              "sep" in t ? (
                <div key={i} className="md-toolbar-sep" />
              ) : (
                <button key={i} type="button" title={t.title} className="md-toolbar-btn" onClick={t.action}>
                  {t.label}
                </button>
              )
            )}
          </div>
          <textarea
            ref={taRef}
            className="text-area"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              minHeight,
              fontFamily: "'JetBrains Mono', 'Consolas', monospace",
              fontSize: 13,
              border: "none",
              borderRadius: 0,
              resize: "vertical",
              display: "block",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* ── Visual (WYSIWYG) tab ── */}
      {tab === "preview" && (
        <>
          <WysiwygEditor
            value={value}
            onChange={onChange}
            onInsertImage={() => imgInputRef.current?.click()}
            onInsertVideo={() => setVideoDialog(true)}
            minHeight={minHeight}
          />
          {value.match(/^!\[/m) && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, textAlign: "right" }}>
              Нажмите на фото для редактирования
            </div>
          )}
        </>
      )}

      {/* ── AI paste tab ── */}
      {/* ── Hidden file input ── */}
      {onUploadFile && (
        <input
          ref={imgInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImageUpload(f);
            e.target.value = "";
          }}
        />
      )}

      {/* ── Image alignment dialog ── */}
      {imageDialog && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setImageDialog(null)}
        >
          <div
            style={{ background: "var(--paper)", borderRadius: 16, padding: 28, width: 480, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Вставить фотографию</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Выберите, как фото будет расположено в тексте</div>

            {/* Image preview */}
            <div style={{ width: "100%", aspectRatio: "16/7", borderRadius: 10, overflow: "hidden", background: "var(--sand)", marginBottom: 20, border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={imageDialog.path}
                alt={imageDialog.name}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>

            {/* Alignment picker */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 22 }}>
              {([
                ["left",   "Слева",    AlignLeftIcon],
                ["center", "По центру", AlignCenterIcon],
                ["right",  "Справа",   AlignRightIcon],
              ] as [Align, string, () => React.ReactElement][]).map(([align, label, Icon]) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => setImageAlign(align)}
                  style={{
                    border: `2px solid ${imageAlign === align ? "var(--clay)" : "var(--line)"}`,
                    borderRadius: 12,
                    padding: "12px 8px 10px",
                    background: imageAlign === align ? "var(--sand)" : "var(--paper)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  <Icon />
                  <span style={{ fontSize: 12, fontWeight: imageAlign === align ? 600 : 400, color: imageAlign === align ? "var(--ink)" : "var(--muted)" }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Caption */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                Подпись к фото
              </label>
              <input
                className="text-input"
                placeholder="Подпись под фотографией (необязательно)"
                value={imageDialog?.caption ?? ""}
                onChange={(e) => imageDialog && setImageDialog({ ...imageDialog, caption: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="secondary-button" onClick={() => setImageDialog(null)}>
                Отмена
              </button>
              <button type="button" className="primary-button" onClick={confirmImageInsert}>
                Вставить фото →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit image dialog (from preview click) ── */}
      {editImgDialog && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setEditImgDialog(null)}
        >
          <div
            style={{ background: "var(--paper)", borderRadius: 16, padding: 28, width: 480, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Редактировать фото</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
              Измените расположение или подпись
            </div>

            {/* Image preview */}
            <div style={{ width: "100%", aspectRatio: "16/7", borderRadius: 10, overflow: "hidden", background: "var(--sand)", marginBottom: 20, border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={editImgDialog.src}
                alt={editImgDialog.caption}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>

            {/* Alignment picker */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {([
                ["left",   "Слева",    AlignLeftIcon],
                ["center", "По центру", AlignCenterIcon],
                ["right",  "Справа",   AlignRightIcon],
              ] as [Align, string, () => React.ReactElement][]).map(([align, label, Icon]) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => setEditImgAlign(align)}
                  style={{
                    border: `2px solid ${editImgAlign === align ? "var(--clay)" : "var(--line)"}`,
                    borderRadius: 12,
                    padding: "12px 8px 10px",
                    background: editImgAlign === align ? "var(--sand)" : "var(--paper)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  <Icon />
                  <span style={{ fontSize: 12, fontWeight: editImgAlign === align ? 600 : 400, color: editImgAlign === align ? "var(--ink)" : "var(--muted)" }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Caption */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                Подпись к фото
              </label>
              <input
                className="text-input"
                placeholder="Подпись под фотографией"
                value={editImgCaption}
                onChange={(e) => setEditImgCaption(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="secondary-button" onClick={() => setEditImgDialog(null)}>
                Отмена
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  updateImage(editImgDialog.idx, editImgAlign, editImgCaption, editImgDialog.width);
                  setEditImgDialog(null);
                  setTab("preview");
                }}
              >
                Применить →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Video dialog ── */}
      {videoDialog && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { setVideoDialog(false); setVideoUrl(""); }}
        >
          <div
            style={{ background: "var(--paper)", borderRadius: 16, padding: 28, minWidth: 400, maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Вставить видео</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
              Поддерживаются YouTube и Vimeo. Вставьте ссылку на видео.
            </div>
            <input
              className="text-input"
              placeholder="https://youtu.be/... или https://vimeo.com/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVideoInsert()}
              autoFocus
            />
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Пример: https://youtu.be/dQw4w9WgXcQ</div>
            {videoUrl.trim() && (extractYouTubeId(videoUrl) || extractVimeoId(videoUrl)) && (
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--forest)", display: "flex", alignItems: "center", gap: 6 }}>
                <Check size={13} strokeWidth={2.5} />
                <span>{extractYouTubeId(videoUrl) ? "YouTube" : "Vimeo"} — ссылка распознана</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button type="button" className="secondary-button" onClick={() => { setVideoDialog(false); setVideoUrl(""); }}>
                Отмена
              </button>
              <button type="button" className="primary-button" onClick={handleVideoInsert}>
                Вставить видео →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Help modal ── */}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

/* ── Alignment picker icons ── */

function AlignLeftIcon() {
  return (
    <svg width="56" height="36" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="22" height="18" rx="3" fill="var(--clay)" opacity="0.7" />
      <rect x="28" y="4" width="26" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
      <rect x="28" y="10" width="20" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
      <rect x="28" y="16" width="24" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
      <rect x="2" y="25" width="52" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
      <rect x="2" y="31" width="40" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="56" height="36" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="2" width="36" height="20" rx="3" fill="var(--clay)" opacity="0.7" />
      <rect x="2" y="26" width="52" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
      <rect x="8" y="32" width="40" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="56" height="36" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="32" y="2" width="22" height="18" rx="3" fill="var(--clay)" opacity="0.7" />
      <rect x="2" y="4" width="26" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
      <rect x="8" y="10" width="20" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
      <rect x="4" y="16" width="24" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
      <rect x="2" y="25" width="52" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
      <rect x="2" y="31" width="40" height="3" rx="1.5" fill="var(--muted)" opacity="0.5" />
    </svg>
  );
}
