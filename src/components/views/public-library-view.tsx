"use client";

import { useState } from "react";
import { usePortal } from "@/components/portal-provider";
import { Search, Download } from "lucide-react";
import type { LibraryItem } from "@/lib/portal-types";
import { EditableText } from "@/components/editable-text";
import { resolveUiText } from "@/lib/ui-text";
import { isListedPublic } from "@/lib/portal-utils";

type SortKey = "year" | "title" | "authors";

export function PublicLibraryView() {
  const { state } = usePortal();

  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("year");

  const openItems = state.libraryItems.filter((i) => isListedPublic(i.access));

  const distinctCategories = [...new Set(openItems.map((i) => i.category))].filter(Boolean).sort();

  const filtered = openItems
    .filter((item) => {
      const hay = `${item.title} ${item.authors} ${item.source} ${item.notes}`.toLowerCase();
      if (query && !hay.includes(query.toLowerCase())) return false;
      if (selectedCat !== "all" && item.category !== selectedCat) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "year") return parseInt(b.year) - parseInt(a.year) || a.title.localeCompare(b.title);
      if (sortBy === "authors") return a.authors.localeCompare(b.authors);
      return a.title.localeCompare(b.title);
    });

  // Group by category
  const grouped: Record<string, LibraryItem[]> = {};
  for (const item of filtered) {
    const cat = item.category || "Прочее";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }
  const cats = Object.keys(grouped).sort();

  return (
    <section className="public-section narrow">
      <EditableText as="div" id="library.kicker" className="section-kicker" style={{ marginBottom: 14 }} />
      <EditableText as="h1" id="library.title" className="page-title" style={{ marginBottom: 14 }} />
      <EditableText as="p" id="library.subtitle" className="page-copy" multiline style={{ margin: "0 0 28px", maxWidth: 580 }} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        <div className="search-wrap-wide" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
          <input
            className="text-input"
            style={{ paddingLeft: 34 }}
            placeholder={resolveUiText(state.uiText, "library.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="select-input"
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          style={{ minWidth: 180 }}
        >
          <option value="all">Все категории</option>
          {distinctCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="select-input"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          style={{ minWidth: 140 }}
        >
          <option value="year">По году</option>
          <option value="title">По названию</option>
          <option value="authors">По авторам</option>
        </select>
      </div>

      {openItems.length === 0 ? (
        <div style={{ color: "var(--muted)", textAlign: "center", padding: "48px 0" }}>
          Библиотека пока пуста
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "var(--muted)", textAlign: "center", padding: "32px 0" }}>
          Ничего не найдено
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {cats.map((cat) => (
            <section key={cat}>
              <div
                className="section-kicker"
                style={{
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: "2px solid var(--clay)",
                  color: "var(--clay)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                }}
              >
                {cat}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {grouped[cat].map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 12,
                      alignItems: "start",
                      padding: "14px 0",
                      borderBottom: idx < grouped[cat].length - 1 ? "1px solid var(--line2)" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3, marginBottom: 4 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--forest2)", marginBottom: item.notes ? 4 : 0 }}>
                        {item.authors}
                        {item.source && (
                          <span style={{ color: "var(--muted)" }}>{" · "}{item.source}</span>
                        )}
                        <span className="mono" style={{ marginLeft: 8, fontSize: 12, color: "var(--muted)" }}>
                          {item.year}
                        </span>
                      </div>
                      {item.notes && (
                        <div style={{ fontSize: 12.5, color: "var(--muted)", fontStyle: "italic" }}>
                          {item.notes}
                        </div>
                      )}
                    </div>
                    {item.pdfPath && (
                      <a
                        href={item.pdfPath}
                        className="secondary-button"
                        download
                        style={{ textDecoration: "none", fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap" }}
                      >
                        <Download size={13} strokeWidth={2} style={{ marginRight: 4 }} />PDF
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 24 }}>
        {filtered.length} из {openItems.length} работ
      </div>
    </section>
  );
}
