"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePortal } from "@/components/portal-provider";
import { MapPin, Plus, Trash2 } from "lucide-react";
import type { MapPlace } from "@/lib/portal-types";

const ExpeditionMap = dynamic(
  () => import("@/components/expedition-map").then((m) => m.ExpeditionMap),
  { ssr: false, loading: () => <div style={{ height: 360, borderRadius: 16, background: "var(--paper2)", border: "1px solid var(--line)" }} /> },
);

type Draft = Omit<MapPlace, "id">;

function blankDraft(): Draft {
  return {
    title: "",
    desc: "",
    lat: 55.79,
    lng: 49.12,
    year: "",
    yearEnd: "",
    era: "modern",
    region: "",
    coverPath: null,
    relatedPublicationIds: [],
    relatedPhotoIds: [],
    relatedMaterialIds: [],
    relatedTopicIds: [],
    relatedArchiveIds: [],
  };
}

function RelList({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: Array<{ id: string; label: string }>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <label className="field-label">{label} ({selected.length})</label>
      <div
        style={{
          maxHeight: 150,
          overflowY: "auto",
          border: "1px solid var(--line)",
          borderRadius: 10,
          padding: 6,
          background: "var(--paper2)",
        }}
      >
        {items.map((item) => {
          const checked = selected.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                width: "100%",
                padding: "7px 9px",
                borderRadius: 7,
                textAlign: "left",
                background: checked ? "var(--sand)" : "transparent",
                fontSize: 13,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 5,
                  flexShrink: 0,
                  border: `1.5px solid ${checked ? "var(--clay)" : "var(--line)"}`,
                  background: checked ? "var(--clay)" : "transparent",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                }}
              >
                {checked ? "✓" : ""}
              </span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdminMapView() {
  const { state, createPlace, updatePlace, deletePlace, uploadFile, askUploadFolder } = usePortal();
  const places = state.mapPlaces;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [saving, setSaving] = useState(false);

  function startNew() {
    setEditingId(null);
    setDraft(blankDraft());
  }

  function edit(place: MapPlace) {
    const { id, ...rest } = place;
    void id;
    setEditingId(place.id);
    setDraft({ ...rest });
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggle(key: keyof Draft, id: string) {
    setDraft((current) => {
      const list = current[key] as string[];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      return { ...current, [key]: next };
    });
  }

  async function save() {
    if (!draft.title.trim()) {
      window.alert("Укажите название места");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updatePlace(editingId, draft);
      } else {
        const created = await createPlace(draft);
        setEditingId(created.id);
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editingId) return;
    if (!window.confirm("Удалить это место с карты?")) return;
    await deletePlace(editingId);
    startNew();
  }

  // Маркеры на карте редактора: все места, активным — редактируемое
  const editorPlaces: MapPlace[] = editingId
    ? places
    : [...places, { ...draft, id: "__draft__" }];

  return (
    <div className="route">
      <div className="dashboard-top" style={{ alignItems: "center" }}>
        <div>
          <div className="section-kicker">Карта экспедиций</div>
          <h1 className="page-title" style={{ margin: 0 }}>Места на карте</h1>
        </div>
        <button className="primary-button" onClick={startNew}>
          <Plus size={15} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 4 }} />
          Новое место
        </button>
      </div>

      <div
        className="preview-note"
        style={{ marginTop: 0, marginBottom: 22, display: "flex", gap: 12, alignItems: "flex-start" }}
      >
        <MapPin size={18} strokeWidth={1.8} style={{ color: "var(--clay)", flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
          Кликните по карте, чтобы поставить точку. Укажите годы, тип (историческое / современное место),
          описание и привяжите фотографии, публикации и материалы — они появятся на публичной карте при нажатии на точку.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 22, alignItems: "start" }}>
        {/* Список мест */}
        <div className="discipline-card" style={{ padding: 12, maxHeight: 620, overflowY: "auto" }}>
          <div className="field-label" style={{ padding: "4px 8px" }}>Места ({places.length})</div>
          {places.map((place) => (
            <button
              key={place.id}
              onClick={() => edit(place)}
              className={`sidebar-link ${editingId === place.id ? "active" : ""}`}
              style={{ borderRadius: 9 }}
            >
              <span
                className="exp-legend-dot"
                style={{ background: place.era === "historic" ? "#7d6a4a" : "#c2643a", marginRight: 0 }}
              />
              <span className="sidebar-link-label" style={{ fontSize: 13 }}>{place.title}</span>
              <span className="sidebar-link-count">{place.year}</span>
            </button>
          ))}
          {places.length === 0 && (
            <div style={{ padding: 12, fontSize: 13, color: "var(--muted)" }}>Пока нет мест.</div>
          )}
        </div>

        {/* Редактор */}
        <div style={{ display: "grid", gap: 18 }}>
          <ExpeditionMap
            places={editorPlaces}
            activeId={editingId || "__draft__"}
            editable
            draft={{ lat: draft.lat, lng: draft.lng }}
            onPick={(lat, lng) => {
              set("lat", Number(lat.toFixed(5)));
              set("lng", Number(lng.toFixed(5)));
            }}
            onSelect={(id) => {
              const place = places.find((p) => p.id === id);
              if (place) edit(place);
            }}
            height={360}
          />

          <div className="discipline-card" style={{ padding: 22 }}>
            <div className="dashboard-top" style={{ marginBottom: 16, alignItems: "center" }}>
              <h2 className="panel-title" style={{ fontSize: 20 }}>
                {editingId ? "Редактирование места" : "Новое место"}
              </h2>
              <div style={{ display: "flex", gap: 10 }}>
                {editingId && (
                  <button className="secondary-button" onClick={remove} style={{ color: "#c0392b" }}>
                    <Trash2 size={14} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 4 }} />
                    Удалить
                  </button>
                )}
                <button className="primary-button" onClick={save} disabled={saving}>
                  {saving ? "Сохраняем..." : "Сохранить"}
                </button>
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div>
                <label className="field-label">Название места</label>
                <input className="text-input" value={draft.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div>
                <label className="field-label">Регион</label>
                <input className="text-input" value={draft.region} onChange={(e) => set("region", e.target.value)} />
              </div>
            </div>

            <div className="form-grid-three" style={{ marginBottom: 14 }}>
              <div>
                <label className="field-label">Тип места</label>
                <select className="select-input" value={draft.era} onChange={(e) => set("era", e.target.value as MapPlace["era"])}>
                  <option value="modern">Современное</option>
                  <option value="historic">Историческое</option>
                </select>
              </div>
              <div>
                <label className="field-label">Год (начало)</label>
                <input className="text-input" value={draft.year} onChange={(e) => set("year", e.target.value)} placeholder="1987" />
              </div>
              <div>
                <label className="field-label">Год (конец, опц.)</label>
                <input className="text-input" value={draft.yearEnd} onChange={(e) => set("yearEnd", e.target.value)} placeholder="2019" />
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div>
                <label className="field-label">Широта (lat)</label>
                <input
                  className="text-input"
                  type="number"
                  step="0.00001"
                  value={draft.lat}
                  onChange={(e) => set("lat", parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="field-label">Долгота (lng)</label>
                <input
                  className="text-input"
                  type="number"
                  step="0.00001"
                  value={draft.lng}
                  onChange={(e) => set("lng", parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Описание</label>
              <textarea className="text-area" value={draft.desc} onChange={(e) => set("desc", e.target.value)} />
            </div>

            <div style={{ marginBottom: 4 }}>
              <label className="field-label">Обложка (опц.)</label>
              <input className="text-input" value={draft.coverPath ?? ""} onChange={(e) => set("coverPath", e.target.value || null)} placeholder="/uploads/..." />
              <input
                type="file"
                accept="image/*"
                style={{ marginTop: 10 }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const folder = await askUploadFolder();
                    if (folder === null) return;
                    const result = await uploadFile(file, folder);
                    set("coverPath", result.path);
                  }
                }}
              />
            </div>

            <RelList
              label="Фотографии"
              items={state.photos.map((p) => ({ id: p.id, label: `${p.title} · ${p.year}` }))}
              selected={draft.relatedPhotoIds}
              onToggle={(id) => toggle("relatedPhotoIds", id)}
            />
            <RelList
              label="Публикации"
              items={state.publications.map((p) => ({ id: p.id, label: `${p.year} · ${p.title}` }))}
              selected={draft.relatedPublicationIds}
              onToggle={(id) => toggle("relatedPublicationIds", id)}
            />
            <RelList
              label="Учебные материалы"
              items={state.materials.map((m) => ({ id: m.id, label: `${m.title} · ${m.discipline}` }))}
              selected={draft.relatedMaterialIds}
              onToggle={(id) => toggle("relatedMaterialIds", id)}
            />
            <RelList
              label="Научные темы"
              items={state.topics.map((t) => ({ id: t.id, label: t.name }))}
              selected={draft.relatedTopicIds}
              onToggle={(id) => toggle("relatedTopicIds", id)}
            />
            <RelList
              label="Архивные материалы"
              items={state.archiveItems.map((a) => ({ id: a.id, label: `${a.title} · ${a.year}` }))}
              selected={draft.relatedArchiveIds}
              onToggle={(id) => toggle("relatedArchiveIds", id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
