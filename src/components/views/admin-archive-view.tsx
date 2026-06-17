"use client";

import { useState } from "react";
import { usePortal } from "@/components/portal-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { accessLabel } from "@/lib/portal-seed";
import { Search, Pencil, X, FolderOpen } from "lucide-react";

const ACCESS_DOT: Record<string, string> = {
  open: "#3a6a44",
  students: "#46566b",
  link: "#a8744a",
  request: "#7d6a4a",
  hidden: "#8c8678",
  owner: "#c0392b",
};

export function AdminArchiveView() {
  const router = useRouter();
  const { state, setAddType, editItem, deleteArchive } = usePortal();

  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedAccess, setSelectedAccess] = useState("all");

  const filteredItems = state.archiveItems.filter((item) => {
    const haystack =
      `${item.title} ${item.desc} ${item.region} ${item.topic} ${item.atype}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (selectedType !== "all" && item.atype !== selectedType) return false;
    if (selectedYear !== "all" && item.year !== selectedYear) return false;
    if (selectedAccess !== "all" && item.access !== selectedAccess) return false;
    return true;
  });

  const distinctTypes = [...new Set(state.archiveItems.map((item) => item.atype))].filter(Boolean);
  const distinctYears = [...new Set(state.archiveItems.map((item) => item.year))]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  function go(href: string) {
    router.push(href);
  }

  return (
    <div className="route">
      <div className="dashboard-top" style={{ alignItems: "center" }}>
        <div>
          <div className="section-kicker">Неопубликованные данные</div>
          <h1 className="page-title" style={{ margin: 0 }}>Архивные материалы</h1>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setAddType("archive");
            go("/admin/add");
          }}
        >
          + Добавить документ
        </button>
      </div>

      <div className="form-grid" style={{ marginBottom: 18 }}>
        <div className="search-wrap-wide">
          <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
          <input
            className="text-input"
            style={{ paddingLeft: 34 }}
            placeholder="Поиск по названию, описанию, теме, региону..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="form-grid" style={{ gap: 10 }}>
          <select
            className="select-input"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">Все типы</option>
            {distinctTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            className="select-input"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">Все годы</option>
            {distinctYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            className="select-input"
            value={selectedAccess}
            onChange={(e) => setSelectedAccess(e.target.value)}
          >
            <option value="all">Любой доступ</option>
            <option value="open">Открыто</option>
            <option value="students">Студентам</option>
            <option value="link">По ссылке</option>
            <option value="request">По запросу</option>
            <option value="hidden">Скрыто</option>
            <option value="owner">Только владелец</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div
          className="panel"
          style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}
        >
          <div style={{ marginBottom: 12, color: "var(--muted)", display: "flex", justifyContent: "center" }}><FolderOpen size={40} strokeWidth={1.2} /></div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Архив пуст</div>
          <div style={{ fontSize: 13 }}>
            Добавьте полевые дневники, схемы, таблицы и другие неопубликованные материалы.
          </div>
          <button
            className="primary-button"
            style={{ marginTop: 20 }}
            onClick={() => { setAddType("archive"); go("/admin/add"); }}
          >
            + Добавить первый документ
          </button>
        </div>
      ) : (
        <section className="panel" style={{ overflow: "visible" }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="archive-row"
              style={{ gridTemplateColumns: "1fr 140px 70px 160px 96px" }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>{item.title}</strong>
                  {item.filePath && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        background: "var(--paper2)",
                        border: "1px solid var(--line)",
                        borderRadius: 4,
                        padding: "1px 5px",
                        color: "var(--clay)",
                      }}
                    >
                      файл
                    </span>
                  )}
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                  {[item.topic, item.region].filter(Boolean).join(" · ")}
                </div>
              </div>

              <div className="mono" style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>
                {item.atype || "—"}
              </div>

              <div className="mono" style={{ fontSize: 12, alignSelf: "center" }}>
                {item.year || "—"}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: "center",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: ACCESS_DOT[item.access] ?? "#8c8678",
                  }}
                />
                <span className="mono" style={{ fontSize: 11, color: "var(--forest2)" }}>
                  {accessLabel(item.access)}
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, alignSelf: "center" }}>
                <Link
                  href={`/admin/add?edit=${item.id}&type=archive`}
                  className="icon-button"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Pencil size={13} strokeWidth={1.8} />
                </Link>
                <button
                  className="icon-button"
                  onClick={() => {
                    if (confirm(`Удалить «${item.title}»?`)) deleteArchive(item.id);
                  }}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 14 }}>
        {filteredItems.length} из {state.archiveItems.length} документов
      </div>
    </div>
  );
}
