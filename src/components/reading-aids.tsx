"use client";

import { useEffect, useState } from "react";

type Heading = { id: string; text: string; level: number };

/**
 * Полоса прогресса чтения (фиксирована вверху) + плавающее оглавление,
 * построенное по заголовкам внутри `.markdown-body`. Оглавление видно
 * только на широких экранах и не мешает основной колонке.
 */
export function ReadingAids({ targetSelector = ".markdown-body" }: { targetSelector?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const root = document.querySelector(targetSelector);
    if (!root) return;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("h1, h2, h3"),
    );

    const collected: Heading[] = nodes.map((node, index) => {
      if (!node.id) {
        node.id = `sec-${index}-${(node.textContent || "")
          .toLowerCase()
          .replace(/[^a-zа-я0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40)}`;
      }
      node.style.scrollMarginTop = "84px";
      return {
        id: node.id,
        text: node.textContent || "",
        level: Number(node.tagName.substring(1)),
      };
    });

    setHeadings(collected);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));

    function onScroll() {
      const el = document.querySelector(targetSelector) as HTMLElement | null;
      if (!el) return;
      const start = el.offsetTop;
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = window.scrollY - start;
      const ratio = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      setProgress(ratio);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [targetSelector]);

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 3,
          width: `${progress * 100}%`,
          background: "var(--clay)",
          zIndex: 50,
          transition: "width 0.1s linear",
        }}
      />

      {headings.length > 1 && (
        <nav className="reading-toc" aria-label="Содержание">
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 10,
            }}
          >
            Содержание
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {headings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    display: "block",
                    padding: "4px 0",
                    paddingLeft: (heading.level - 1) * 12,
                    fontSize: 13,
                    lineHeight: 1.35,
                    color: activeId === heading.id ? "var(--clay)" : "var(--forest2)",
                    fontWeight: activeId === heading.id ? 600 : 400,
                    borderLeft: `2px solid ${activeId === heading.id ? "var(--clay)" : "transparent"}`,
                  }}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
