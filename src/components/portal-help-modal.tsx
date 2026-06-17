"use client";

import { useEffect, useState } from "react";
import { parseMarkdown } from "@/lib/portal-utils";
import { useMarkdownEffects } from "@/lib/use-markdown-effects";
import { X } from "lucide-react";

const AI_PROMPT = `Ты помогаешь оформить научную статью для публикации на сайте профессора-геолога.
Сайт поддерживает специальный диалект Markdown. Вот правила форматирования:

ЗАГОЛОВКИ:
- ## Раздел  — крупный заголовок
- ### Подраздел  — подзаголовок
- #### Пункт  — мелкий заголовок
- НЕ используй # (H1) — это зарезервировано для названия

ТЕКСТ:
- **жирный**, *курсив*, ***жирный курсив***
- [текст](ссылка) для ссылок

СПИСКИ:
- Маркированные: начинай строку с \`- \`
- Нумерованные: начинай с \`1. \`, \`2. \` и т.д.

ИЗОБРАЖЕНИЯ (ВАЖНО — пути указывает владелец):
- ![Подпись](ПУТЬ) — по центру
- ![Подпись|left](ПУТЬ) — слева, текст обтекает
- ![Подпись|right](ПУТЬ) — справа, текст обтекает
- Вместо реального пути используй: /uploads/ОПИСАНИЕ-ФОТО.jpg

ВИДЕО:
- @[youtube](ID_ВИДЕО) — встроенный плеер YouTube
- ID — это часть ссылки после youtu.be/ или ?v=

ТАБЛИЦЫ:
| Заголовок 1 | Заголовок 2 |
|:------------|------------:|
| Данные      | Данные      |
Выравнивание: :--- влево, ---: вправо, :---: по центру

ЦИТАТЫ:
> Текст цитаты или примечания

РАЗДЕЛИТЕЛИ:
--- (три дефиса на отдельной строке)

ДИАГРАММЫ:
\`\`\`mermaid
graph TD
    A[узел] --> B[узел]
\`\`\`

ФОРМУЛЫ LaTeX:
- Инлайн: $формула$
- Блок: $$формула$$

ЗАДАЧА: Возьми текст ниже и оформь его в соответствии с этими правилами.
Структурируй текст, выдели заголовки, оформи списки и таблицы где нужно.
Для изображений используй плейсхолдеры вида /uploads/название-фото.jpg —
владелец заменит пути при вставке на сайт.
Выведи ТОЛЬКО готовый Markdown без пояснений.

ТЕКСТ СТАТЬИ:
[вставьте текст здесь]`;

export function HelpModal({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/ARTICLE_FORMAT.md")
      .then((r) => r.text())
      .then(setContent)
      .catch(() => setContent("Не удалось загрузить справку."));
  }, []);

  useMarkdownEffects(content || null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = AI_PROMPT;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,8,6,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--paper)",
          borderRadius: 18,
          width: "min(820px, 100%)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid var(--line)",
            flexShrink: 0,
            gap: 14,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 19, color: "var(--ink)" }}>
              Справка по форматированию
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Поддерживаемые элементы Markdown на этом сайте
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            <button
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 16px",
                borderRadius: 10,
                border: "none",
                background: copied ? "var(--forest)" : "var(--clay)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Скопировано!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="4" y="1" width="9" height="11" rx="2" stroke="#fff" strokeWidth="1.5" />
                    <path d="M4 3H3a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Скопировать подсказку для ИИ
                </>
              )}
            </button>
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid var(--line)",
                background: "var(--sand)",
                fontSize: 18,
                color: "var(--muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Copy hint */}
        <div
          style={{
            background: "var(--sand)",
            borderBottom: "1px solid var(--line)",
            padding: "10px 24px",
            fontSize: 12,
            color: "var(--forest2)",
            lineHeight: 1.5,
            flexShrink: 0,
          }}
        >
          Нажмите <b style={{ color: "var(--ink)" }}>«Скопировать подсказку для ИИ»</b> — затем откройте ChatGPT или Claude, вставьте подсказку и добавьте текст своей статьи. ИИ оформит всё в нужный формат, а вы вставите результат через вкладку <b style={{ color: "var(--ink)" }}>«Вставить из ИИ»</b>.
        </div>

        {/* Content */}
        <div
          style={{ overflowY: "auto", flex: 1, padding: "24px 28px" }}
        >
          {content ? (
            <div
              className="markdown-body"
              style={{ textAlign: "left", color: "var(--ink)" }}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: "var(--muted)", fontSize: 14 }}>
              Загрузка...
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid var(--line)",
            padding: "14px 24px",
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            className="secondary-button"
            style={{ fontSize: 13 }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
