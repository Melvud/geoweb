"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { usePortal } from "@/components/portal-provider";
import { MapPin, ArrowRight, FileText, BookOpen, Layers } from "lucide-react";

const ExpeditionMap = dynamic(
  () => import("@/components/expedition-map").then((m) => m.ExpeditionMap),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 460, borderRadius: 16, background: "var(--paper2)", border: "1px solid var(--line)" }} />
    ),
  },
);

export function ExpeditionsExplorer({ height = 460 }: { height?: number }) {
  const router = useRouter();
  const { state, openDetail } = usePortal();
  const places = state.mapPlaces;

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = places.find((p) => p.id === activeId) || null;

  const related = useMemo(() => {
    if (!active) return null;
    const pick = <T extends { id: string }>(arr: T[], ids: string[]) =>
      arr.filter((i) => ids.includes(i.id));
    return {
      photos: pick(state.photos, active.relatedPhotoIds),
      publications: pick(state.publications, active.relatedPublicationIds),
      materials: pick(state.materials, active.relatedMaterialIds),
      topics: pick(state.topics, active.relatedTopicIds),
      archive: pick(state.archiveItems, active.relatedArchiveIds),
    };
  }, [active, state]);

  const cover = active?.coverPath || (related?.photos[0]?.imagePath ?? null);

  if (places.length === 0) {
    return (
      <div className="empty-state">
        <div className="panel-title" style={{ fontSize: 22, marginBottom: 6 }}>Карта пока пуста</div>
        <div style={{ fontSize: 14 }}>Скоро здесь появится интерактивная карта полевых экспедиций.</div>
      </div>
    );
  }

  return (
    <div className="exp-layout">
      <div className="exp-main">
        <ExpeditionMap places={places} activeId={activeId} onSelect={setActiveId} height={height} />
        <div className="exp-legend">
          <span><span className="exp-legend-dot exp-historic" /> Исторические точки</span>
          <span><span className="exp-legend-dot exp-modern" /> Современные экспедиции</span>
        </div>
      </div>

      <aside className={`exp-panel ${active ? "open" : ""}`}>
        {active && related ? (
          <div key={active.id} className="exp-panel-inner">
            {cover && (
              <div className="exp-panel-cover" style={{ backgroundImage: `url(${cover})` }} />
            )}

            <div className="exp-panel-body">
              <div className="mono exp-panel-meta">
                <span className={`exp-era-chip exp-${active.era}`}>
                  {active.era === "historic" ? "историческое" : "современное"}
                </span>
                <span>
                  {active.year}
                  {active.yearEnd ? `–${active.yearEnd}` : ""}
                </span>
              </div>

              <h2 className="panel-title" style={{ fontSize: 22, lineHeight: 1.2, margin: "10px 0 4px" }}>
                {active.title}
              </h2>
              {active.region && (
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>
                  <MapPin size={11} strokeWidth={2} style={{ verticalAlign: -1, marginRight: 4 }} />
                  {active.region}
                </div>
              )}
              {active.desc && (
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--forest2)", margin: "0 0 16px" }}>
                  {active.desc}
                </p>
              )}

              {related.photos.length > 0 && (
                <div className="exp-section">
                  <div className="field-label">Фотографии</div>
                  <div className="exp-photo-row">
                    {related.photos.map((photo) => (
                      <button
                        key={photo.id}
                        className="exp-photo"
                        onClick={() => openDetail({ kind: "photo", item: photo })}
                        style={{
                          backgroundImage: photo.imagePath ? `url(${photo.imagePath})` : undefined,
                          background: !photo.imagePath
                            ? `repeating-linear-gradient(135deg, ${photo.tint}, ${photo.tint} 8px, rgba(255,255,255,.16) 8px, rgba(255,255,255,.16) 16px)`
                            : undefined,
                        }}
                        title={photo.title}
                      />
                    ))}
                  </div>
                </div>
              )}

              {related.publications.length > 0 && (
                <div className="exp-section">
                  <div className="field-label">Публикации</div>
                  {related.publications.map((pub) => (
                    <button key={pub.id} className="exp-link-row" onClick={() => router.push(`/publications/${pub.id}`)}>
                      <FileText size={14} strokeWidth={1.9} style={{ color: "var(--clay)", flexShrink: 0 }} />
                      <span style={{ flex: 1, textAlign: "left" }}>{pub.title}</span>
                      <ArrowRight size={13} strokeWidth={2} style={{ color: "var(--clay)" }} />
                    </button>
                  ))}
                </div>
              )}

              {related.materials.length > 0 && (
                <div className="exp-section">
                  <div className="field-label">Учебные материалы</div>
                  {related.materials.map((mat) => (
                    <button key={mat.id} className="exp-link-row" onClick={() => openDetail({ kind: "mat", item: mat })}>
                      <BookOpen size={14} strokeWidth={1.9} style={{ color: "var(--clay)", flexShrink: 0 }} />
                      <span style={{ flex: 1, textAlign: "left" }}>{mat.title}</span>
                      <ArrowRight size={13} strokeWidth={2} style={{ color: "var(--clay)" }} />
                    </button>
                  ))}
                </div>
              )}

              {related.topics.length > 0 && (
                <div className="exp-section">
                  <div className="field-label">Научные темы</div>
                  {related.topics.map((topic) => (
                    <button key={topic.id} className="exp-link-row" onClick={() => router.push(`/research/${topic.id}`)}>
                      <Layers size={14} strokeWidth={1.9} style={{ color: "var(--clay)", flexShrink: 0 }} />
                      <span style={{ flex: 1, textAlign: "left" }}>{topic.name}</span>
                      <ArrowRight size={13} strokeWidth={2} style={{ color: "var(--clay)" }} />
                    </button>
                  ))}
                </div>
              )}

              {related.archive.length > 0 && (
                <div className="exp-section">
                  <div className="field-label">Архивные материалы</div>
                  {related.archive.map((item) => (
                    <button key={item.id} className="exp-link-row" onClick={() => openDetail({ kind: "archive", item })}>
                      <FileText size={14} strokeWidth={1.9} style={{ color: "var(--muted)", flexShrink: 0 }} />
                      <span style={{ flex: 1, textAlign: "left" }}>{item.title}</span>
                      <ArrowRight size={13} strokeWidth={2} style={{ color: "var(--clay)" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="exp-panel-placeholder">
            <MapPin size={30} strokeWidth={1.4} />
            <div style={{ fontSize: 14, marginTop: 10 }}>
              Выберите точку на карте, чтобы увидеть описание, фотографии и материалы.
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
