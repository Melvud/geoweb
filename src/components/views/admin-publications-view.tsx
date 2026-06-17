"use client";

import { useState } from "react";
import { usePortal } from "@/components/portal-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Pencil, X } from "lucide-react";

export function AdminPublicationsView() {
  const router = useRouter();
  const { state, setAddType, editItem, deletePublication } = usePortal();

  // Local state for admin filtering of publications
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  const filteredPublications = state.publications.filter((item) => {
    const haystack = `${item.title} ${item.authors} ${item.journal} ${item.topic} ${item.region}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (selectedType !== "all" && item.ptype !== selectedType) return false;
    if (selectedYear !== "all" && item.year !== selectedYear) return false;
    return true;
  });

  const distinctYears = [...new Set(state.publications.map((item) => item.year))].sort((a, b) => b.localeCompare(a));
  const distinctTypes = [...new Set(state.publications.map((item) => item.ptype))];

  function go(href: string) {
    router.push(href);
  }



  return (
    <div className="route">
      <div className="dashboard-top" style={{ alignItems: "center" }}>
        <div>
          <div className="section-kicker">Хранилище научных трудов</div>
          <h1 className="page-title" style={{ margin: 0 }}>Все публикации</h1>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setAddType("publication");
            go("/admin/add");
          }}
        >
          + Добавить
        </button>
      </div>

      <div className="form-grid" style={{ marginBottom: 18 }}>
        <div className="search-wrap-wide">
          <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
          <input
            className="text-input"
            style={{ paddingLeft: 34 }}
            placeholder="Поиск по названию, авторам, теме, журналу"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="form-grid" style={{ gap: 10 }}>
          <select
            className="select-input"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            <option value="all">Все типы</option>
            {distinctTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            className="select-input"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            <option value="all">Все годы</option>
            {distinctYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <section className="panel" style={{ overflow: "visible" }}>
        {filteredPublications.map((item) => {
          return (
            <div
              key={item.id}
              className="archive-row"
              style={{ gridTemplateColumns: "1fr 140px 70px 96px", gap: 16 }}
            >
              <div>
                <div style={{ marginBottom: 4 }}>
                  <span
                    className="type-chip"
                    style={{ background: "var(--sand)", color: "var(--forest2)", textTransform: "uppercase", fontSize: 10, marginRight: 8 }}
                  >
                    {item.ptype}
                  </span>
                  <strong>{item.title}</strong>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                  {item.authors} {item.journal ? `· ${item.journal}` : ""}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                {item.topic || "—"}
              </div>
              <div className="mono" style={{ fontSize: 12 }}>{item.year}</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Link
                  href={`/admin/add?edit=${item.id}&type=publication`}
                  className="icon-button"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Pencil size={13} strokeWidth={1.8} />
                </Link>
                <button className="icon-button" onClick={() => deletePublication(item.id)}>
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          );
        })}
        {filteredPublications.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
            Публикации не найдены
          </div>
        )}
      </section>
    </div>
  );
}
