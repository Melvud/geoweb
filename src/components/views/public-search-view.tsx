"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortal } from "@/components/portal-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { typeShort, typeTint } from "@/lib/portal-utils";
import { X, ChevronRight } from "lucide-react";
import type {
  ArchiveItem,
  LibraryItem,
  Material,
  Photo,
  Publication,
  Topic,
} from "@/lib/portal-types";

type Hit = { kind: string; id: string };

type Resolved = {
  kind: string;
  id: string;
  title: string;
  meta: string;
  year?: string;
  region?: string;
  age?: string;
  discipline?: string;
  raw: any;
};

const KIND_LABELS: Record<string, string> = {
  material: "Учебные материалы",
  publication: "Публикации",
  photo: "Фотографии",
  topic: "Научные темы",
  archive: "Архив",
  library: "Библиотека",
};

const KIND_ORDER = ["material", "publication", "topic", "photo", "archive", "library"];

export function PublicSearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, openDetail } = usePortal();

  const searchQuery = searchParams.get("q") ?? "";

  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  const [fKind, setFKind] = useState<string>("all");
  const [fYear, setFYear] = useState<string>("all");
  const [fRegion, setFRegion] = useState<string>("all");
  const [fAge, setFAge] = useState<string>("all");
  const [fDiscipline, setFDiscipline] = useState<string>("all");

  // Запрос к FTS-бэкенду
  useEffect(() => {
    if (!searchQuery.trim()) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data: { results?: Hit[] }) => {
        if (!cancelled) setHits(data.results ?? []);
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  // Сброс фильтров при новом запросе
  useEffect(() => {
    setFKind("all");
    setFYear("all");
    setFRegion("all");
    setFAge("all");
    setFDiscipline("all");
  }, [searchQuery]);

  // Маппинг id → полные объекты из загруженного состояния
  const resolved: Resolved[] = useMemo(() => {
    const maps = {
      material: new Map(state.materials.map((i: Material) => [i.id, i])),
      publication: new Map(state.publications.map((i: Publication) => [i.id, i])),
      photo: new Map(state.photos.map((i: Photo) => [i.id, i])),
      topic: new Map(state.topics.map((i: Topic) => [i.id, i])),
      archive: new Map(state.archiveItems.map((i: ArchiveItem) => [i.id, i])),
      library: new Map(state.libraryItems.map((i: LibraryItem) => [i.id, i])),
    } as Record<string, Map<string, any>>;

    const out: Resolved[] = [];
    for (const hit of hits) {
      const item = maps[hit.kind]?.get(hit.id);
      if (!item) continue;
      if (hit.kind === "material") {
        out.push({ kind: hit.kind, id: hit.id, title: item.title, meta: `${item.discipline} · ${item.year}`, year: item.year, discipline: item.discipline, raw: item });
      } else if (hit.kind === "publication") {
        out.push({ kind: hit.kind, id: hit.id, title: item.title, meta: `${item.authors}${item.journal ? ` · ${item.journal}` : ""}`, year: item.year, region: item.region, age: item.age, raw: item });
      } else if (hit.kind === "photo") {
        out.push({ kind: hit.kind, id: hit.id, title: item.title, meta: `${item.otype} · ${item.year}`, year: item.year, region: item.region, age: item.age, raw: item });
      } else if (hit.kind === "topic") {
        out.push({ kind: hit.kind, id: hit.id, title: item.name, meta: `${item.region || ""}${item.age ? ` · ${item.age}` : ""}`, region: item.region, age: item.age, raw: item });
      } else if (hit.kind === "archive") {
        out.push({ kind: hit.kind, id: hit.id, title: item.title, meta: `${item.atype} · ${item.year}`, year: item.year, region: item.region, raw: item });
      } else if (hit.kind === "library") {
        out.push({ kind: hit.kind, id: hit.id, title: item.title, meta: `${item.authors} · ${item.year}`, year: item.year, raw: item });
      }
    }
    return out;
  }, [hits, state]);

  const distinct = (key: keyof Resolved) =>
    Array.from(new Set(resolved.map((r) => r[key]).filter(Boolean) as string[])).sort();

  const years = distinct("year");
  const regions = distinct("region");
  const ages = distinct("age");
  const disciplines = distinct("discipline");

  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of resolved) counts[r.kind] = (counts[r.kind] || 0) + 1;
    return counts;
  }, [resolved]);

  const filtered = resolved.filter((r) => {
    if (fKind !== "all" && r.kind !== fKind) return false;
    if (fYear !== "all" && r.year !== fYear) return false;
    if (fRegion !== "all" && r.region !== fRegion) return false;
    if (fAge !== "all" && r.age !== fAge) return false;
    if (fDiscipline !== "all" && r.discipline !== fDiscipline) return false;
    return true;
  });

  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    items: filtered.filter((r) => r.kind === kind),
  })).filter((g) => g.items.length > 0);

  function openHit(r: Resolved) {
    if (r.kind === "publication") return router.push(`/publications/${r.id}`);
    if (r.kind === "topic") return router.push(`/research/${r.id}`);
    if (r.kind === "material") return openDetail({ kind: "mat", item: r.raw });
    if (r.kind === "photo") return openDetail({ kind: "photo", item: r.raw });
    if (r.kind === "archive") return openDetail({ kind: "archive", item: r.raw });
    if (r.kind === "library") return openDetail({ kind: "library", item: r.raw });
  }

  const selectStyle = {
    padding: "8px 12px",
    borderRadius: 9,
    border: "1px solid var(--line)",
    background: "var(--paper)",
    color: "var(--ink)",
    fontSize: 13,
  } as const;

  return (
    <section className="public-section narrow">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
        <div className="section-kicker">Поиск по сайту</div>
        <button className="panel-link" onClick={() => router.push("/")}>
          очистить <X size={12} strokeWidth={2.5} />
        </button>
      </div>
      <h1 className="page-title" style={{ fontSize: 38, marginBottom: 6 }}>
        «{searchQuery}»
      </h1>
      <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>
        {loading ? "Поиск..." : `Найдено: ${filtered.length}${filtered.length !== resolved.length ? ` из ${resolved.length}` : ""}`}
      </div>

      {/* Фильтры */}
      {resolved.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <button
              className={`segmented-pill ${fKind === "all" ? "active" : ""}`}
              style={{ border: "1px solid var(--line)", background: fKind === "all" ? "var(--clay)" : "var(--paper)", color: fKind === "all" ? "#fff" : "var(--forest2)", borderRadius: 20 }}
              onClick={() => setFKind("all")}
            >
              Всё ({resolved.length})
            </button>
            {KIND_ORDER.filter((k) => kindCounts[k]).map((k) => (
              <button
                key={k}
                className={`segmented-pill ${fKind === k ? "active" : ""}`}
                style={{ border: "1px solid var(--line)", background: fKind === k ? "var(--clay)" : "var(--paper)", color: fKind === k ? "#fff" : "var(--forest2)", borderRadius: 20 }}
                onClick={() => setFKind(k)}
              >
                {KIND_LABELS[k]} ({kindCounts[k]})
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {disciplines.length > 1 && (
              <select style={selectStyle} value={fDiscipline} onChange={(e) => setFDiscipline(e.target.value)}>
                <option value="all">Все дисциплины</option>
                {disciplines.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
            {years.length > 1 && (
              <select style={selectStyle} value={fYear} onChange={(e) => setFYear(e.target.value)}>
                <option value="all">Любой год</option>
                {years.sort((a, b) => b.localeCompare(a)).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
            {regions.length > 1 && (
              <select style={selectStyle} value={fRegion} onChange={(e) => setFRegion(e.target.value)}>
                <option value="all">Любой регион</option>
                {regions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
            {ages.length > 1 && (
              <select style={selectStyle} value={fAge} onChange={(e) => setFAge(e.target.value)}>
                <option value="all">Любой возраст</option>
                {ages.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      {!loading && searchQuery.trim() && filtered.length === 0 && (
        <div className="empty-state">
          <div className="panel-title" style={{ fontSize: 24, marginBottom: 6 }}>Ничего не найдено</div>
          <div style={{ fontSize: 14 }}>
            Попробуйте другой запрос — например, «пермь», «двустворки» или «керн».
          </div>
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.kind} style={{ marginBottom: 30 }}>
          <div className="section-kicker" style={{ color: "var(--forest2)", marginBottom: 14 }}>
            {KIND_LABELS[group.kind]}
          </div>
          {group.kind === "photo" ? (
            <div className="search-photo-grid">
              {group.items.map((r) => (
                <button key={r.id} onClick={() => openHit(r)} style={{ textAlign: "left" }}>
                  <div
                    style={{
                      aspectRatio: "4 / 3",
                      borderRadius: 10,
                      border: "1px solid var(--line)",
                      backgroundImage: r.raw.imagePath ? `url(${r.raw.imagePath})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      background: !r.raw.imagePath ? `repeating-linear-gradient(135deg, ${r.raw.tint}, ${r.raw.tint} 11px, rgba(255,255,255,.16) 11px, rgba(255,255,255,.16) 22px)` : undefined,
                    }}
                  />
                  <div className="panel-title" style={{ fontSize: 13.5, marginTop: 7 }}>{r.title}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{r.meta}</div>
                </button>
              ))}
            </div>
          ) : (
            group.items.map((r) => {
              const tint = r.kind === "material" ? typeTint(r.raw.mtype) : null;
              return (
                <button
                  key={r.id}
                  className="list-row"
                  style={{ padding: "13px 12px", borderRadius: 10, borderBottom: 0 }}
                  onClick={() => openHit(r)}
                >
                  {tint ? (
                    <span className="type-chip" style={{ background: tint[0], color: tint[1] }}>
                      {typeShort(r.raw.mtype)}
                    </span>
                  ) : r.year ? (
                    <span className="serif-title" style={{ fontSize: 18, fontWeight: 600, color: "var(--clay)", width: 46 }}>
                      {r.year}
                    </span>
                  ) : (
                    <span style={{ width: 40, height: 28, borderRadius: 7, background: "var(--sand)" }} />
                  )}
                  <span className="list-row-body">
                    <span className="panel-title" style={{ fontSize: 15 }}>{r.title}</span>
                    <br />
                    <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{r.meta}</span>
                  </span>
                  <ChevronRight size={16} strokeWidth={2} style={{ color: "var(--clay)", flexShrink: 0 }} />
                </button>
              );
            })
          )}
        </div>
      ))}
    </section>
  );
}
