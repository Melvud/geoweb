"use client";

import { usePortal } from "@/components/portal-provider";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { EditableText } from "@/components/editable-text";
import { resolveUiText } from "@/lib/ui-text";
import { isListedPublic } from "@/lib/portal-utils";

const publicationCollections = [
  ["all", "Все"],
  ["featured", "Избранные"],
  ["Монография", "Монографии"],
  ["Статья", "Статьи"],
  ["bivalve", "По двустворкам"],
  ["perm", "Пермские отложения"],
];

export function PublicPublicationsView() {
  const router = useRouter();
  const { state, setPubQuery, setPubCollection } = usePortal();

  const publicPublications = state.publications.filter((item) => isListedPublic(item.access));

  let publicationList = [...publicPublications];
  if (state.pubCollection === "featured") {
    publicationList = publicationList.filter((item) => item.featured);
  } else if (state.pubCollection === "Монография" || state.pubCollection === "Статья") {
    publicationList = publicationList.filter((item) => item.ptype === state.pubCollection);
  } else if (state.pubCollection === "bivalve") {
    publicationList = publicationList.filter((item) =>
      `${item.title} ${item.topic}`.toLowerCase().includes("двуствор"),
    );
  } else if (state.pubCollection === "perm") {
    publicationList = publicationList.filter((item) =>
      `${item.title} ${item.topic} ${item.age}`.toLowerCase().includes("перм"),
    );
  }

  if (state.pubQuery.trim()) {
    const query = state.pubQuery.toLowerCase();
    publicationList = publicationList.filter((item) =>
      `${item.title} ${item.authors} ${item.journal} ${item.topic} ${item.region} ${item.age}`
        .toLowerCase()
        .includes(query),
    );
  }

  publicationList.sort((a, b) => b.year.localeCompare(a.year));

  return (
    <section className="public-section narrow">
      <EditableText
        as="div"
        id="publications.kicker"
        className="section-kicker"
        style={{ marginBottom: 14 }}
      />
      <EditableText
        as="h1"
        id="publications.title"
        className="page-title"
        style={{ marginBottom: 26 }}
      />
      <div className="search-wrap-wide" style={{ marginBottom: 16 }}>
        <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
        <input
          className="text-input"
          style={{ paddingLeft: 38 }}
          placeholder={resolveUiText(state.uiText, "publications.searchPlaceholder")}
          value={state.pubQuery}
          onChange={(event) => setPubQuery(event.target.value)}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
        {publicationCollections.map(([key, label]) => (
          <button
            key={key}
            className={`segmented-pill ${state.pubCollection === key ? "active" : ""}`}
            style={{
              border: "1px solid var(--line)",
              background:
                state.pubCollection === key ? "var(--clay)" : "var(--paper)",
              color: state.pubCollection === key ? "#fff" : "var(--forest2)",
              borderRadius: 20,
            }}
            onClick={() => setPubCollection(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14 }}>
        {publicationList.length} публикаций
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {publicationList.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(`/publications/${item.id}`)}
            style={{
              display: "grid",
              gridTemplateColumns: "64px 1fr",
              gap: 18,
              padding: "20px 16px",
              borderBottom: "1px solid var(--line)",
              textAlign: "left",
            }}
          >
            <div className="serif-title" style={{ fontSize: 26, fontWeight: 600, color: "var(--clay)" }}>
              {item.year}
            </div>
            <div>
              <div style={{ marginBottom: 6 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 5,
                    background: "var(--sand)",
                    color: "var(--forest2)",
                    textTransform: "uppercase",
                  }}
                >
                  {item.ptype}
                </span>
              </div>
              <h3 className="panel-title" style={{ fontSize: 21, lineHeight: 1.25, marginBottom: 6 }}>
                {item.title}
              </h3>
              <div style={{ fontSize: 13.5, color: "var(--forest2)", marginBottom: 3 }}>
                {item.authors}
              </div>
              <div className="serif-title" style={{ fontSize: 14, fontStyle: "italic", color: "var(--muted)" }}>
                {item.journal}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
