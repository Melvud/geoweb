"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, BookOpen, Camera, ExternalLink, FileText, GraduationCap, Link2, MapPin, Plus, Search, Unlink, X } from "lucide-react";
import { usePortal } from "@/components/portal-provider";
import type { FormState } from "@/lib/portal-types";

type RelationKind = "materials" | "publications" | "photos" | "archive" | "library" | "mapPlaces";
type RelationItem = {
  id: string;
  title: string;
  meta: string;
  topicIds: string[];
  preview: () => void;
  editHref: string;
};

const relationConfig: Array<{
  kind: RelationKind;
  label: string;
  shortLabel: string;
  field: keyof FormState;
  createType?: string;
  icon: typeof FileText;
}> = [
  { kind: "publications", label: "Публикации", shortLabel: "Публикации", field: "relatedPublicationIds", createType: "publication", icon: FileText },
  { kind: "materials", label: "Учебные материалы", shortLabel: "Учебные", field: "relatedMaterialIds", createType: "learning", icon: GraduationCap },
  { kind: "photos", label: "Фотографии", shortLabel: "Фото", field: "relatedPhotoIds", createType: "photo", icon: Camera },
  { kind: "archive", label: "Архивные материалы", shortLabel: "Архив", field: "relatedArchiveIds", createType: "archive", icon: Archive },
  { kind: "library", label: "Библиотека", shortLabel: "Библиотека", field: "relatedLibraryIds", icon: BookOpen },
  { kind: "mapPlaces", label: "Точки на карте", shortLabel: "Карта", field: "relatedMapPlaceIds", icon: MapPin },
];

export function TopicRelationsEditor() {
  const { state, updateForm, openDetail, refreshData } = usePortal();
  const [activeKind, setActiveKind] = useState<RelationKind>("publications");
  const [scope, setScope] = useState<"linked" | "all">("linked");
  const [query, setQuery] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState<{ kind: RelationKind; item: RelationItem } | null>(null);
  const [replacementTopicId, setReplacementTopicId] = useState("");
  const removedRelationsRef = useRef(new Set<string>());
  const topicId = state.form.entityId;

  useEffect(() => {
    const refreshAfterChildEditor = () => void refreshData();
    window.addEventListener("focus", refreshAfterChildEditor);
    return () => window.removeEventListener("focus", refreshAfterChildEditor);
  }, [refreshData]);

  const itemsByKind = useMemo<Record<RelationKind, RelationItem[]>>(() => ({
    publications: state.publications.map((item) => ({
      id: item.id, title: item.title, meta: `${item.year} · ${item.authors || item.journal || "Публикация"}`,
      topicIds: item.relatedTopicIds || [], preview: () => openDetail({ kind: "pub", item }),
      editHref: `/admin/add?edit=${item.id}&type=publication`,
    })),
    materials: state.materials.map((item) => ({
      id: item.id, title: item.title, meta: `${item.year} · ${item.mtype} · ${item.discipline}`,
      topicIds: item.relatedTopicIds || [], preview: () => openDetail({ kind: "mat", item }),
      editHref: `/admin/add?edit=${item.id}&type=learning`,
    })),
    photos: state.photos.map((item) => ({
      id: item.id, title: item.title, meta: `${item.year} · ${item.location || item.region || item.otype}`,
      topicIds: item.relatedTopicIds || [], preview: () => openDetail({ kind: "photo", item }),
      editHref: `/admin/add?edit=${item.id}&type=photo`,
    })),
    archive: state.archiveItems.map((item) => ({
      id: item.id, title: item.title, meta: `${item.year} · ${item.atype} · ${item.region}`,
      topicIds: item.relatedTopicIds || [], preview: () => openDetail({ kind: "archive", item }),
      editHref: `/admin/add?edit=${item.id}&type=archive`,
    })),
    library: state.libraryItems.map((item) => ({
      id: item.id, title: item.title, meta: `${item.year} · ${item.authors} · ${item.category}`,
      topicIds: item.relatedTopicIds || [], preview: () => openDetail({ kind: "library", item }),
      editHref: `/admin/library?edit=${item.id}`,
    })),
    mapPlaces: state.mapPlaces.map((item) => ({
      id: item.id, title: item.title, meta: `${item.year} · ${item.region}`,
      topicIds: item.relatedTopicIds || [], preview: () => window.open(`/?place=${item.id}`, "_blank"),
      editHref: `/admin/map?edit=${item.id}`,
    })),
  }), [state.publications, state.materials, state.photos, state.archiveItems, state.libraryItems, state.mapPlaces, openDetail]);

  useEffect(() => {
    if (!topicId) return;
    for (const entry of relationConfig) {
      const current = state.form[entry.field] as string[];
      const external = itemsByKind[entry.kind]
        .filter((item) => item.topicIds.includes(topicId) && !removedRelationsRef.current.has(`${entry.kind}:${item.id}`))
        .map((item) => item.id);
      const merged = [...new Set([...current, ...external])];
      if (merged.length !== current.length) updateForm(entry.field, merged);
    }
  }, [topicId, itemsByKind, state.form.relatedMaterialIds, state.form.relatedPublicationIds, state.form.relatedPhotoIds, state.form.relatedArchiveIds, state.form.relatedLibraryIds, state.form.relatedMapPlaceIds, updateForm]);

  const config = relationConfig.find((entry) => entry.kind === activeKind)!;
  const ActiveIcon = config.icon;
  const selectedIds = state.form[config.field] as string[];
  const visibleItems = itemsByKind[activeKind].filter((item) => {
    if (scope === "linked" && !selectedIds.includes(item.id)) return false;
    const haystack = `${item.title} ${item.meta}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const otherTopics = state.topics.filter((topic) => topic.id !== topicId);

  function setSelected(kind: RelationKind, ids: string[]) {
    const relation = relationConfig.find((entry) => entry.kind === kind)!;
    updateForm(relation.field, ids);
  }

  function addItem(kind: RelationKind, item: RelationItem) {
    const relation = relationConfig.find((entry) => entry.kind === kind)!;
    const ids = state.form[relation.field] as string[];
    setSelected(kind, [...new Set([...ids, item.id])]);
    removedRelationsRef.current.delete(`${kind}:${item.id}`);
    const replacements = { ...state.form.relationReplacements };
    delete replacements[`${kind}:${item.id}`];
    updateForm("relationReplacements", replacements);
  }

  function requestRemoval(kind: RelationKind, item: RelationItem) {
    const storedTopic = state.topics.find((topic) => topic.id === topicId);
    const storedIds = kind === "publications" ? storedTopic?.relatedPublicationIds
      : kind === "photos" ? storedTopic?.relatedPhotoIds
        : kind === "archive" ? storedTopic?.relatedArchiveIds
          : [];
    const wasPersisted = item.topicIds.includes(topicId || "") || Boolean(storedIds?.includes(item.id));
    if (!topicId || !wasPersisted || item.topicIds.some((id) => id !== topicId)) {
      const relation = relationConfig.find((entry) => entry.kind === kind)!;
      removedRelationsRef.current.add(`${kind}:${item.id}`);
      setSelected(kind, (state.form[relation.field] as string[]).filter((id) => id !== item.id));
      return;
    }
    setReplacementTopicId("");
    setPendingRemoval({ kind, item });
  }

  function confirmReplacement() {
    if (!pendingRemoval || !replacementTopicId) return;
    const relation = relationConfig.find((entry) => entry.kind === pendingRemoval.kind)!;
    removedRelationsRef.current.add(`${pendingRemoval.kind}:${pendingRemoval.item.id}`);
    setSelected(pendingRemoval.kind, (state.form[relation.field] as string[]).filter((id) => id !== pendingRemoval.item.id));
    updateForm("relationReplacements", {
      ...state.form.relationReplacements,
      [`${pendingRemoval.kind}:${pendingRemoval.item.id}`]: replacementTopicId,
    });
    setPendingRemoval(null);
  }

  const createHref = topicId
    ? activeKind === "library"
      ? `/admin/library?new=1&topic=${topicId}`
      : `/admin/add?new=1&type=${config.createType}&topic=${topicId}`
    : null;

  return (
    <section className="topic-relations-editor">
      <div className="topic-relations-head">
        <div>
          <h2>Материалы научной темы</h2>
          <p>Просматривайте связи, добавляйте существующие материалы или создавайте новые.</p>
        </div>
        <div className="topic-relations-total"><Link2 size={15} /> {relationConfig.reduce((sum, entry) => sum + (state.form[entry.field] as string[]).length, 0)} связей</div>
      </div>

      <div className="topic-relation-tabs" role="tablist" aria-label="Тип материала">
        {relationConfig.map((entry) => {
          const Icon = entry.icon;
          const count = (state.form[entry.field] as string[]).length;
          return (
            <button key={entry.kind} type="button" role="tab" aria-selected={activeKind === entry.kind} className={activeKind === entry.kind ? "active" : ""} onClick={() => setActiveKind(entry.kind)}>
              <Icon size={14} /><span>{entry.shortLabel}</span><b>{count}</b>
            </button>
          );
        })}
      </div>

      <div className="topic-relations-toolbar">
        <div className="topic-relations-scope">
          <button type="button" className={scope === "linked" ? "active" : ""} onClick={() => setScope("linked")}>Привязано</button>
          <button type="button" className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>Все материалы</button>
        </div>
        <label className="topic-relations-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Поиск: ${config.label.toLowerCase()}`} /></label>
        {createHref ? (
          <Link className="topic-relations-create" href={createHref} target="_blank"><Plus size={14} /> Создать новый</Link>
        ) : (
          <button type="button" className="topic-relations-create" disabled title="Сначала сохраните научную тему"><Plus size={14} /> Создать новый</button>
        )}
      </div>

      <div className="topic-relations-list">
        {visibleItems.map((item) => {
          const linked = selectedIds.includes(item.id);
          const linkedTopics = state.topics.filter((topic) => item.topicIds.includes(topic.id) && topic.id !== topicId);
          return (
            <article key={item.id} className={`topic-relation-row${linked ? " linked" : ""}`}>
              <button type="button" className="topic-relation-main" onClick={item.preview}>
                <span className="topic-relation-icon"><ActiveIcon size={16} /></span>
                <span><strong>{item.title}</strong><small>{item.meta}</small></span>
              </button>
              <div className="topic-relation-other-topics">
                {linkedTopics.slice(0, 2).map((topic) => <span key={topic.id}>{topic.name}</span>)}
                {linkedTopics.length > 2 ? <span>+{linkedTopics.length - 2}</span> : null}
              </div>
              <div className="topic-relation-actions">
                <Link href={item.editHref} target="_blank" title="Редактировать"><ExternalLink size={14} /></Link>
                {linked ? (
                  <button type="button" className="remove" onClick={() => requestRemoval(activeKind, item)}><Unlink size={14} /> Убрать</button>
                ) : (
                  <button type="button" className="add" onClick={() => addItem(activeKind, item)}><Plus size={14} /> Добавить</button>
                )}
              </div>
            </article>
          );
        })}
        {visibleItems.length === 0 ? (
          <div className="topic-relations-empty">{scope === "linked" ? "В этой категории пока нет привязанных материалов." : "Материалы не найдены."}</div>
        ) : null}
      </div>

      {pendingRemoval ? (
        <div className="topic-replacement-backdrop" role="presentation">
          <div className="topic-replacement-dialog" role="dialog" aria-modal="true" aria-labelledby="replacement-title">
            <button type="button" className="topic-replacement-close" onClick={() => setPendingRemoval(null)} aria-label="Отменить"><X size={17} /></button>
            <div className="topic-replacement-icon"><Unlink size={20} /></div>
            <h3 id="replacement-title">Сначала выберите другую тему</h3>
            <p>«{pendingRemoval.item.title}» привязан только к этой научной теме. Без темы материал оставлять нельзя.</p>
            {otherTopics.length > 0 ? (
              <select className="select-input" value={replacementTopicId} onChange={(event) => setReplacementTopicId(event.target.value)} autoFocus>
                <option value="">Выберите научную тему…</option>
                {otherTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            ) : (
              <div className="topic-replacement-warning">Других научных тем пока нет. Создайте новую тему или отмените операцию.</div>
            )}
            <div className="topic-replacement-actions">
              <button type="button" className="secondary-button" onClick={() => setPendingRemoval(null)}>Отменить</button>
              <button type="button" className="primary-button" disabled={!replacementTopicId} onClick={confirmReplacement}>Перенести и убрать</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
