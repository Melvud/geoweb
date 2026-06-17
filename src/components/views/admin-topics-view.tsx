"use client";

import { useState } from "react";
import { usePortal } from "@/components/portal-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Pencil, X } from "lucide-react";

export function AdminTopicsView() {
  const router = useRouter();
  const { state, setAddType, deleteTopic } = usePortal();
  const [query, setQuery] = useState("");

  const filteredTopics = state.topics.filter((item) => {
    const haystack = `${item.name} ${item.desc} ${item.region} ${item.age}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  function go(href: string) {
    router.push(href);
  }

  return (
    <div className="route">
      <div className="dashboard-top" style={{ alignItems: "center" }}>
        <div>
          <div className="section-kicker">Связывание материалов</div>
          <h1 className="page-title" style={{ margin: 0 }}>Научные темы</h1>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setAddType("topic");
            go("/admin/add");
          }}
        >
          + Новая тема
        </button>
      </div>

      <div className="search-wrap-wide" style={{ marginBottom: 18 }}>
        <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
        <input
          className="text-input"
          style={{ paddingLeft: 34 }}
          placeholder="Поиск по названию темы, региону, возрасту..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <section className="panel" style={{ overflow: "visible" }}>
        {filteredTopics.map((item) => (
          <div
            key={item.id}
            className="archive-row"
            style={{ gridTemplateColumns: "1fr 140px 140px 96px", gap: 16 }}
          >
            <div>
              <div style={{ marginBottom: 4 }}>
                <strong>{item.name}</strong>
              </div>
              <div style={{ fontSize: 13, color: "var(--forest2)" }}>
                {item.desc}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
              {item.region} · {item.age}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--clay)" }}>
              {item.pubs} публ. · {item.photos} фото · {item.archive} док.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Link
                href={`/admin/add?edit=${item.id}&type=topic`}
                className="icon-button"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              >
                <Pencil size={13} strokeWidth={1.8} />
              </Link>
              <button className="icon-button" onClick={() => deleteTopic(item.id)}>
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
        {filteredTopics.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
            Научные темы не найдены
          </div>
        )}
      </section>
    </div>
  );
}
