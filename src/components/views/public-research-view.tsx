"use client";

import { usePortal } from "@/components/portal-provider";
import Link from "next/link";
import { EditableText } from "@/components/editable-text";
import { isListedPublic } from "@/lib/portal-utils";

export function PublicResearchView() {
  const { state } = usePortal();
  const topics = state.topics.filter((t) => isListedPublic(t.access));

  return (
    <section className="public-section">
      <EditableText as="div" id="research.kicker" className="section-kicker" style={{ marginBottom: 14 }} />
      <EditableText as="h1" id="research.title" className="page-title" style={{ marginBottom: 12 }} />
      <EditableText as="p" id="research.subtitle" className="page-copy" multiline style={{ margin: "0 0 36px", maxWidth: 580 }} />
      <div className="topics-grid">
        {topics.map((item) => {
          const pubsCount = state.publications.filter(p => (item.relatedPublicationIds?.includes(p.id) || p.relatedTopicIds?.includes(item.id) || p.topic === item.name) && isListedPublic(p.access)).length;
          const photosCount = state.photos.filter(p => (item.relatedPhotoIds?.includes(p.id) || p.group === item.name) && isListedPublic(p.access)).length;
          const archiveCount = state.archiveItems.filter(p => (item.relatedArchiveIds?.includes(p.id) || p.relatedTopicIds?.includes(item.id) || p.topic === item.name) && isListedPublic(p.access)).length;
          const materialsCount = state.materials.filter(m => m.relatedTopicIds?.includes(item.id) && isListedPublic(m.access)).length;
          const libraryCount = state.libraryItems.filter(m => m.relatedTopicIds?.includes(item.id) && isListedPublic(m.access)).length;
          const mapPlacesCount = state.mapPlaces.filter(m => m.relatedTopicIds?.includes(item.id)).length;

          return (
          <Link
            key={item.id}
            href={`/research/${item.id}`}
            className="topic-card"
            style={{ textDecoration: "none", color: "inherit", textAlign: "left" }}
          >
            <div style={{ display: "flex", gap: 9, marginBottom: 13, flexShrink: 0 }}>
              {item.age && (
                <span
                  className="mono"
                  style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: "var(--sand)" }}
                >
                  {item.age}
                </span>
              )}
              {item.region && (
                <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                  {item.region}
                </span>
              )}
            </div>
            <h3
              className="panel-title clamp-2"
              style={{ fontSize: 22, lineHeight: 1.2, marginBottom: 10 }}
            >
              {item.name}
            </h3>
            <p
              className="clamp-3"
              style={{ flex: 1, fontSize: 14, lineHeight: 1.55, color: "var(--forest2)", margin: "0 0 14px" }}
            >
              {item.desc}
            </p>
            <div className="mono" style={{ fontSize: 11, color: "var(--clay)", marginTop: "auto", display: "flex", flexWrap: "wrap", gap: "4px 8px" }}>
              {pubsCount > 0 && <span>{pubsCount} публ.</span>}
              {photosCount > 0 && <span>{photosCount} фото</span>}
              {archiveCount > 0 && <span>{archiveCount} архив</span>}
              {materialsCount > 0 && <span>{materialsCount} учеб.</span>}
              {libraryCount > 0 && <span>{libraryCount} библ.</span>}
              {mapPlacesCount > 0 && <span>{mapPlacesCount} карт.</span>}
            </div>
          </Link>
        )})}
      </div>
    </section>
  );
}
