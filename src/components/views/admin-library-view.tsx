"use client";

import { useEffect, useRef, useState } from "react";
import { usePortal } from "@/components/portal-provider";
import { FilePicker } from "@/components/file-picker";
import { MarkdownEditor } from "@/components/portal-markdown-editor";
import { TopicMultiSelect } from "@/components/topic-multi-select";
import { Search, Pencil, X, BookOpen, Folder, Sparkles } from "lucide-react";
import type { LibraryItem, AccessLevel } from "@/lib/portal-types";

const BLANK: Omit<LibraryItem, "id"> = {
  title: "",
  authors: "",
  year: new Date().getFullYear().toString(),
  category: "",
  source: "",
  pdfPath: null,
  notes: "",
  access: "open",
  relatedTopicIds: [],
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="field-label" style={{ marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

export function AdminLibraryView() {
  const { state, createLibrary, updateLibrary, deleteLibrary, uploadFile } = usePortal();

  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [editItem, setEditItem] = useState<Partial<LibraryItem> & { _new?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pdfPickerOpen, setPdfPickerOpen] = useState(false);
  const queryHandledRef = useRef("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newRequested = params.get("new") === "1";
    const editId = params.get("edit");
    const topicId = params.get("topic");
    const key = newRequested ? `new:${topicId || ""}` : editId ? `edit:${editId}` : "";
    if (!key || queryHandledRef.current === key || !state.loaded) return;
    queryHandledRef.current = key;
    if (newRequested) {
      setEditItem({ ...BLANK, relatedTopicIds: topicId ? [topicId] : [], _new: true });
    } else if (editId) {
      const item = state.libraryItems.find((entry) => entry.id === editId);
      if (item) setEditItem({ ...item });
    }
  }, [state.loaded, state.libraryItems]);

  const distinctCategories = [...new Set(state.libraryItems.map((i) => i.category))].filter(Boolean).sort();

  const filtered = state.libraryItems.filter((item) => {
    const hay = `${item.title} ${item.authors} ${item.source} ${item.notes}`.toLowerCase();
    if (query && !hay.includes(query.toLowerCase())) return false;
    if (selectedCat !== "all" && item.category !== selectedCat) return false;
    return true;
  });

  // Group by category for display
  const grouped: Record<string, LibraryItem[]> = {};
  for (const item of filtered) {
    const cat = item.category || "Без категории";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }
  const cats = Object.keys(grouped).sort();

  function openAdd() {
    setEditItem({ ...BLANK, _new: true });
  }

  function openEdit(item: LibraryItem) {
    setEditItem({ ...item });
  }

  async function handleSave() {
    if (!editItem) return;
    setSaving(true);
    try {
      const { _new, id, ...data } = editItem as any;
      if (_new) {
        await createLibrary(data as Omit<LibraryItem, "id">);
      } else {
        await updateLibrary(id, data);
      }
      setEditItem(null);
    } finally {
      setSaving(false);
    }
  }

  async function importPdf(path: string) {
    setImporting(true);
    setImportMessage(null);
    try {
      const response = await fetch("/api/pdf-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await response.json() as { error?: string; title?: string; authors?: string; year?: string; source?: string; content?: string; pages?: number; tables?: number; images?: string[] };
      if (!response.ok) throw new Error(data.error || "Не удалось разобрать PDF");
      setEditItem((prev) => prev ? {
        ...prev,
        pdfPath: path,
        title: data.title || prev.title,
        authors: data.authors || prev.authors,
        year: data.year || prev.year,
        source: data.source || prev.source,
        notes: data.content || prev.notes,
      } : prev);
      setImportMessage({ kind: "ok", text: `Перенесено: ${data.pages ?? 0} стр., ${data.tables ?? 0} табл., ${data.images?.length ?? 0} изображений.` });
    } catch (error) {
      setImportMessage({ kind: "error", text: error instanceof Error ? error.message : "Ошибка импорта PDF" });
    } finally {
      setImporting(false);
    }
  }

  async function handleUploadPdf(file: File) {
    setUploading(true);
    try {
      const result = await uploadFile(file);
      setEditItem((prev) => prev ? { ...prev, pdfPath: result.path } : prev);
      await importPdf(result.path);
    } finally {
      setUploading(false);
    }
  }

  const allCategorySuggestions = distinctCategories;

  return (
    <div className="route">
      <div className="dashboard-top" style={{ alignItems: "center" }}>
        <div>
          <div className="section-kicker">Чужие работы</div>
          <h1 className="page-title" style={{ margin: 0 }}>Библиотека</h1>
        </div>
        <button className="primary-button" onClick={openAdd}>+ Добавить работу</button>
      </div>

      {/* Filters */}
      <div className="form-grid" style={{ marginBottom: 18, gridTemplateColumns: "1fr auto" }}>
        <div className="search-wrap-wide">
          <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
          <input
            className="text-input"
            style={{ paddingLeft: 34 }}
            placeholder="Поиск по названию, авторам, источнику..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="select-input" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
          <option value="all">Все категории</option>
          {distinctCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* List */}
      {state.libraryItems.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>
          <div style={{ marginBottom: 12, color: "var(--muted)", display: "flex", justifyContent: "center" }}><BookOpen size={44} strokeWidth={1.2} /></div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Библиотека пуста</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>
            Добавляйте чужие работы и статьи в формате PDF, сортируйте по категориям.
          </div>
          <button className="primary-button" onClick={openAdd}>+ Добавить первую работу</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
          Ничего не найдено
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {cats.map((cat) => (
            <section key={cat}>
              <div
                className="section-kicker"
                style={{ marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid var(--line)" }}
              >
                {cat} · {grouped[cat].length}
              </div>
              <div className="panel" style={{ overflow: "visible", padding: 0 }}>
                {grouped[cat].map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 160px 60px 80px",
                      gap: 12,
                      alignItems: "center",
                      padding: "12px 16px",
                      borderBottom: idx < grouped[cat].length - 1 ? "1px solid var(--line2)" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.title}</div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                        {item.authors}{item.source ? ` · ${item.source}` : ""}
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                      {item.year}
                    </div>
                    <div>
                      {item.pdfPath ? (
                        <a
                          href={item.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="secondary-button"
                          style={{ fontSize: 11, padding: "4px 8px", textDecoration: "none", display: "inline-block" }}
                        >
                          PDF
                        </a>
                      ) : (
                        <span className="mono" style={{ fontSize: 11, color: "var(--line)" }}>—</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="icon-button" onClick={() => openEdit(item)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Pencil size={13} strokeWidth={1.8} /></button>
                      <button
                        className="icon-button"
                        onClick={() => { if (confirm(`Удалить «${item.title}»?`)) deleteLibrary(item.id); }}
                      >
                        <X size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 14 }}>
        {filtered.length} из {state.libraryItems.length} работ
      </div>

      {/* Edit/Add modal */}
      {editItem && (
        <div className="detail-backdrop" onClick={() => setEditItem(null)}>
          <div
            className="detail-dialog"
            style={{ maxWidth: 860, padding: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="panel-title" style={{ marginBottom: 20 }}>
              {(editItem as any)._new ? "Добавить работу" : "Редактировать"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Название *">
                <input
                  className="text-input"
                  value={editItem.title ?? ""}
                  onChange={(e) => setEditItem((p) => p && { ...p, title: e.target.value })}
                  placeholder="Название книги / статьи"
                />
              </Field>

              <Field label="Авторы *">
                <input
                  className="text-input"
                  value={editItem.authors ?? ""}
                  onChange={(e) => setEditItem((p) => p && { ...p, authors: e.target.value })}
                  placeholder="Фамилия И. О., ..."
                />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Год">
                  <input
                    className="text-input"
                    value={editItem.year ?? ""}
                    onChange={(e) => setEditItem((p) => p && { ...p, year: e.target.value })}
                    placeholder="2023"
                  />
                </Field>
                <Field label="Категория">
                  <input
                    className="text-input"
                    list="lib-cat-list"
                    value={editItem.category ?? ""}
                    onChange={(e) => setEditItem((p) => p && { ...p, category: e.target.value })}
                    placeholder="Стратиграфия, Палеонтология..."
                  />
                  <datalist id="lib-cat-list">
                    {allCategorySuggestions.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </Field>
              </div>

              <Field label="Источник / Журнал / Книга">
                <input
                  className="text-input"
                  value={editItem.source ?? ""}
                  onChange={(e) => setEditItem((p) => p && { ...p, source: e.target.value })}
                  placeholder="Журнал, издательство, сборник..."
                />
              </Field>

              <Field label="Научные темы">
                <TopicMultiSelect
                  topics={state.topics}
                  selected={editItem.relatedTopicIds ?? []}
                  onChange={(relatedTopicIds) => setEditItem((current) => current && ({ ...current, relatedTopicIds }))}
                />
              </Field>

              <Field label="PDF файл">
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {editItem.pdfPath ? (
                    <>
                      <a
                        href={editItem.pdfPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="secondary-button"
                        style={{ textDecoration: "none", fontSize: 13 }}
                      >
                        Открыть PDF
                      </a>
                      <button type="button" className="secondary-button" onClick={() => void importPdf(editItem.pdfPath!)} disabled={importing}>
                        <Sparkles size={13} style={{ marginRight: 5 }} /> {importing ? "Перенос…" : "Заполнить из PDF"}
                      </button>
                      <button
                        className="icon-button"
                        style={{ fontSize: 11 }}
                        onClick={() => setEditItem((p) => p && { ...p, pdfPath: null })}
                      >
                        <X size={12} strokeWidth={2} />
                      </button>
                    </>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <label style={{ cursor: "pointer" }}>
                        <input
                          type="file"
                          accept=".pdf"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadPdf(f);
                          }}
                        />
                        <span className="secondary-button" style={{ display: "inline-block" }}>
                          {uploading ? "Загрузка..." : "↑ Загрузить PDF"}
                        </span>
                      </label>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setPdfPickerOpen(true)}
                      >
                        <Folder size={13} strokeWidth={1.8} style={{ marginRight: 5 }} /> Из загруженных
                      </button>
                    </div>
                  )}
                </div>
                {importMessage && <div style={{ marginTop: 7, fontSize: 12, color: importMessage.kind === "ok" ? "var(--forest2)" : "var(--red)" }}>{importMessage.text}</div>}
              </Field>

              <Field label="Заметки / перенесённый текст">
                <MarkdownEditor
                  value={editItem.notes ?? ""}
                  onChange={(value) => setEditItem((p) => p && { ...p, notes: value })}
                  onUploadFile={uploadFile}
                  placeholder="Краткое примечание или текст, перенесённый из PDF..."
                  minHeight={220}
                />
              </Field>

              <Field label="Доступ">
                <select
                  className="select-input"
                  value={editItem.access ?? "open"}
                  onChange={(e) => setEditItem((p) => p && { ...p, access: e.target.value as AccessLevel })}
                >
                  <option value="open">Открыто</option>
                  <option value="students">Студентам</option>
                  <option value="link">По ссылке</option>
                  <option value="hidden">Скрыто</option>
                  <option value="owner">Только владелец</option>
                </select>
              </Field>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                className="primary-button"
                onClick={handleSave}
                disabled={saving || !editItem.title?.trim() || !editItem.authors?.trim() || !(editItem.relatedTopicIds?.length)}
                title={!editItem.relatedTopicIds?.length ? "Выберите хотя бы одну научную тему" : undefined}
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button className="secondary-button" onClick={() => setEditItem(null)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {pdfPickerOpen && (
        <FilePicker
          accept=".pdf"
          label="Выбрать PDF"
          onSelect={(path) => void importPdf(path)}
          onClose={() => setPdfPickerOpen(false)}
        />
      )}
    </div>
  );
}
