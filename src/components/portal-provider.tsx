"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FolderPromptDialog } from "@/components/folder-prompt-dialog";
import { blankForm, makeSeedState, disciplines, topicOptions } from "@/lib/portal-seed";
import type {
  AccessLevel,
  AddLayout,
  AddType,
  ArchiveItem,
  DetailState,
  FormState,
  LibraryItem,
  MapPlace,
  Material,
  MaterialFilter,
  MaterialStatus,
  Photo,
  PortalState,
  Publication,
  SitePages,
  Topic,
} from "@/lib/portal-types";

type PageSlug = keyof SitePages;
type UploadResult = { path: string; name: string; size: number };

type PortalContextValue = {
  state: PortalState;
  setTheme: () => void;
  setAddType: (type: AddType) => void;
  setAddLayout: (layout: AddLayout) => void;
  updateForm: (field: keyof FormState, value: FormState[keyof FormState]) => void;
  addTag: (value: string) => void;
  removeTag: (value: string) => void;
  setFilter: (field: keyof MaterialFilter, value: string) => void;
  resetFilter: () => void;
  setPubCollection: (value: string) => void;
  setPubQuery: (value: string) => void;
  setSearchQuery: (value: string) => void;
  setPublicDiscipline: (value: string | null) => void;
  openDetail: (detail: DetailState) => void;
  closeDetail: () => void;
  cycleStatus: (id: string) => void;
  deleteMaterial: (id: string) => void;
  deletePublication: (id: string) => void;
  deletePhoto: (id: string) => void;
  deleteTopic: (id: string) => void;
  deleteArchive: (id: string) => void;
  deleteLibrary: (id: string) => void;
  createLibrary: (item: Omit<LibraryItem, "id">) => Promise<LibraryItem>;
  updateLibrary: (id: string, patch: Partial<LibraryItem>) => Promise<LibraryItem>;
  createPlace: (item: Omit<MapPlace, "id">) => Promise<MapPlace>;
  updatePlace: (id: string, patch: Partial<MapPlace>) => Promise<MapPlace>;
  deletePlace: (id: string) => Promise<void>;
  saveDraft: () => Promise<void>;
  publishForm: () => Promise<void>;
  useTemplate: (type: AddType, values: Record<string, string | undefined>) => void;
  useTagSuggestion: (value: string) => void;
  setAccess: (value: AccessLevel) => void;
  setStatus: (value: MaterialStatus) => void;
  refreshData: () => Promise<void>;
  toggleEditMode: () => void;
  saveUiText: (key: string, value: string) => Promise<void>;
  savePage: <T extends PageSlug>(slug: T, payload: SitePages[T]) => Promise<void>;
  uploadFile: (file: File, folder?: string) => Promise<UploadResult>;
  askUploadFolder: () => Promise<string | null>;
  editItem: (type: AddType, item: any) => void;
  isAdminUnlocked: boolean;
  unlockAdmin: (key: string) => Promise<boolean>;
};

const PortalContext = createContext<PortalContextValue | null>(null);
const THEME_STORAGE_KEY = "geoweb-theme";
const ADMIN_AUTH_KEY = "geoweb-admin-auth";

type SnapshotResponse = Pick<
  PortalState,
  "materials" | "publications" | "photos" | "topics" | "archiveItems" | "libraryItems" | "mapPlaces" | "pages" | "uiText"
>;

async function readJson<T>(response: Response) {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function mergeSnapshot(current: PortalState, snapshot: SnapshotResponse): PortalState {
  return {
    ...current,
    ...snapshot,
    loaded: true,
  };
}

function buildMaterial(form: FormState, status: MaterialStatus): Omit<Material, "id"> & { id?: string | null } {
  return {
    id: form.entityId,
    title: form.title.trim() || "Без названия",
    discipline: form.discipline,
    mtype: form.mtype,
    year: form.year.trim(),
    language: form.lang,
    status,
    access: form.access,
    tags: form.tags,
    desc: form.desc.trim(),
    course: form.course,
    filePath: form.filePath,
    previewPath: form.previewPath,
    attachments: form.attachments || [],
    relatedTopicIds: form.relatedTopicIds,
  };
}

function buildPublication(form: FormState, draft: boolean): Omit<Publication, "id"> & { id?: string | null } {
  return {
    id: form.entityId,
    year: form.year.trim(),
    authors: form.authors.trim(),
    title: form.title.trim() || "Без названия",
    ptype: form.ptype,
    journal: form.journal.trim(),
    doi: form.doi.trim(),
    externalUrl: form.externalUrl.trim(),
    pdfPath: form.pdfPath,
    pdfPublic: form.pdfPublic,
    summary: form.summary.trim() || form.desc.trim(),
    topic: form.topic,
    region: form.region.trim(),
    age: form.age.trim(),
    keywords: form.tags,
    language: form.lang,
    featured: form.featured,
    access: draft ? "owner" : form.access,
    attachments: form.attachments || [],
    relatedTopicIds: form.relatedTopicIds,
  };
}

function resolvePhotoGroup(form: FormState) {
  if (form.groupName.trim()) {
    return form.groupName.trim();
  }

  if (form.otype === "Экспедиция") {
    return "Экспедиции 1983-2026";
  }

  return "Геологические объекты";
}

function buildPhoto(form: FormState, status: MaterialStatus): Omit<Photo, "id"> & { id?: string | null } {
  return {
    id: form.entityId,
    title: form.title.trim() || "Без названия",
    year: form.year.trim(),
    imagePath: form.imagePath,
    location: form.location.trim(),
    region: form.region.trim(),
    otype: form.otype,
    age: form.age.trim(),
    desc: form.desc.trim(),
    author: form.author.trim(),
    tags: form.tags,
    usagePolicy: form.usagePolicy.trim(),
    group: resolvePhotoGroup(form),
    access: form.access,
    status,
    relatedPublicationIds: form.relatedPublicationIds,
    relatedTopicIds: form.relatedTopicIds,
    tint: "#b9a98b",
  };
}

function buildTopic(form: FormState): Omit<Topic, "id" | "pubs" | "photos" | "archive" | "attachments"> & { id?: string | null; attachments?: Array<{ name: string; path: string; size?: number }> } {
  return {
    id: form.entityId,
    name: form.title.trim() || "Без названия",
    region: form.region.trim(),
    age: form.age.trim(),
    desc: form.desc.trim(),
    body: form.body.trim(),
    coverPath: form.coverPath,
    keywords: form.tags,
    access: form.access,
    relatedPublicationIds: form.relatedPublicationIds,
    relatedPhotoIds: form.relatedPhotoIds,
    relatedArchiveIds: form.relatedArchiveIds,
    attachments: form.attachments || [],
  };
}

function buildArchive(form: FormState): Omit<ArchiveItem, "id" | "statusLabel"> & { id?: string | null } {
  return {
    id: form.entityId,
    title: form.title.trim() || "Без названия",
    atype: form.mtype.trim() || "Документ",
    desc: form.desc.trim(),
    filePath: form.filePath,
    year: form.year.trim(),
    region: form.region.trim(),
    topic: form.topic.trim(),
    ownerComment: form.ownerComment.trim(),
    access: form.access,
    relatedPublicationIds: form.relatedPublicationIds,
    relatedPhotoIds: form.relatedPhotoIds,
    relatedTopicIds: form.relatedTopicIds,
    dot: "#9c7a3a",
    attachments: form.attachments || [],
  };
}

async function mutateRecord(
  kind: "materials" | "publications" | "photos" | "topics" | "archive",
  entityId: string | null,
  payload: unknown,
) {
  const url = entityId
    ? `/api/content/${kind}/${entityId}`
    : `/api/content/${kind}`;
  const method = entityId ? "PATCH" : "POST";

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return await readJson<{ item: any }>(response);
}

async function syncTopicFormRelations(topicId: string, form: FormState) {
  const response = await fetch(`/api/topics/${topicId}/relations`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      selections: {
        materials: form.relatedMaterialIds,
        publications: form.relatedPublicationIds,
        photos: form.relatedPhotoIds,
        archive: form.relatedArchiveIds,
        library: form.relatedLibraryIds,
        mapPlaces: form.relatedMapPlaceIds,
      },
      replacements: form.relationReplacements,
    }),
  });
  await readJson<{ ok: boolean }>(response);
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalState>(() => makeSeedState());
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const toastTimer = useRef<number | null>(null);

  // Глобальный диалог выбора папки при загрузке файлов
  const [folderPromptOpen, setFolderPromptOpen] = useState(false);
  const folderResolver = useRef<((folder: string | null) => void) | null>(null);
  const askUploadFolder = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      folderResolver.current = resolve;
      setFolderPromptOpen(true);
    });
  }, []);
  const resolveFolder = useCallback((folder: string | null) => {
    setFolderPromptOpen(false);
    const resolve = folderResolver.current;
    folderResolver.current = null;
    resolve?.(folder);
  }, []);

  function flash(toast: string) {
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }

    setState((current) => ({ ...current, toast }));
    toastTimer.current = window.setTimeout(() => {
      setState((current) => ({ ...current, toast: null }));
    }, 2400);
  }

  async function refreshData() {
    const response = await fetch("/api/portal", { cache: "no-store" });
    const snapshot = await readJson<SnapshotResponse>(response);
    setState((current) => mergeSnapshot(current, snapshot));
  }

  async function unlockAdmin(key: string): Promise<boolean> {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (res.ok) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
      setIsAdminUnlocked(true);
      return true;
    }
    return false;
  }

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      setState((current) => ({ ...current, theme: savedTheme }));
    }

    if (sessionStorage.getItem(ADMIN_AUTH_KEY) === "1") {
      setIsAdminUnlocked(true);
    }

    void refreshData().catch((error) => {
      flash(error instanceof Error ? error.message : "Не удалось загрузить данные");
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, state.theme);
  }, [state.theme]);

  const value = useMemo<PortalContextValue>(
    () => ({
      state,
      isAdminUnlocked,
      unlockAdmin,
      setTheme: () =>
        setState((current) => ({
          ...current,
          theme: current.theme === "dark" ? "light" : "dark",
        })),
      setAddType: (type) =>
        setState((current) => ({
          ...current,
          addType: type,
          form: {
            ...blankForm(type),
            authors:
              type === "publication" ? current.form.authors || "Силантьев В. В." : blankForm(type).authors,
          },
        })),
      setAddLayout: (layout) =>
        setState((current) => ({
          ...current,
          addLayout: layout,
        })),
      updateForm: (field, value) =>
        setState((current) => ({
          ...current,
          draftAt: Date.now(),
          form: { ...current.form, [field]: value },
        })),
      addTag: (value) =>
        setState((current) => {
          const tag = value.trim();
          if (!tag || current.form.tags.includes(tag)) {
            return {
              ...current,
              form: { ...current.form, tagDraft: "" },
            };
          }

          return {
            ...current,
            draftAt: Date.now(),
            form: {
              ...current.form,
              tags: [...current.form.tags, tag],
              tagDraft: "",
            },
          };
        }),
      removeTag: (value) =>
        setState((current) => ({
          ...current,
          draftAt: Date.now(),
          form: {
            ...current.form,
            tags: current.form.tags.filter((tag) => tag !== value),
          },
        })),
      setFilter: (field, value) =>
        setState((current) => ({
          ...current,
          filter: { ...current.filter, [field]: value },
        })),
      resetFilter: () =>
        setState((current) => ({
          ...current,
          filter: { q: "", type: "all", discipline: "all", status: "all", year: "all" },
        })),
      setPubCollection: (value) =>
        setState((current) => ({
          ...current,
          pubCollection: value,
        })),
      setPubQuery: (value) =>
        setState((current) => ({
          ...current,
          pubQuery: value,
        })),
      setSearchQuery: (value) =>
        setState((current) => ({
          ...current,
          searchQuery: value,
        })),
      setPublicDiscipline: (value) =>
        setState((current) => ({
          ...current,
          publicDiscipline: value,
        })),
      openDetail: (detail) =>
        setState((current) => ({
          ...current,
          detail,
        })),
      closeDetail: () =>
        setState((current) => ({
          ...current,
          detail: null,
        })),
      cycleStatus: async (id) => {
        const material = state.materials.find((item) => item.id === id);
        if (!material) {
          return;
        }

        const status: MaterialStatus =
          material.status === "published"
            ? "hidden"
            : material.status === "hidden"
              ? "draft"
              : "published";

        await mutateRecord("materials", id, { status });
        await refreshData();
      },
      deleteMaterial: async (id) => {
        const response = await fetch(`/api/content/materials/${id}`, { method: "DELETE" });
        await readJson<{ ok: boolean }>(response);
        await refreshData();
        flash("Материал удален");
      },
      deletePublication: async (id) => {
        const response = await fetch(`/api/content/publications/${id}`, { method: "DELETE" });
        await readJson<{ ok: boolean }>(response);
        await refreshData();
        flash("Публикация удалена");
      },
      deletePhoto: async (id) => {
        const response = await fetch(`/api/content/photos/${id}`, { method: "DELETE" });
        await readJson<{ ok: boolean }>(response);
        await refreshData();
        flash("Фотография удалена");
      },
      deleteTopic: async (id) => {
        const response = await fetch(`/api/content/topics/${id}`, { method: "DELETE" });
        await readJson<{ ok: boolean }>(response);
        await refreshData();
        flash("Научная тема удалена");
      },
      deleteArchive: async (id) => {
        const response = await fetch(`/api/content/archive/${id}`, { method: "DELETE" });
        await readJson<{ ok: boolean }>(response);
        await refreshData();
        flash("Архивный документ удалён");
      },
      deleteLibrary: async (id) => {
        const response = await fetch(`/api/content/library/${id}`, { method: "DELETE" });
        await readJson<{ ok: boolean }>(response);
        await refreshData();
        flash("Запись удалена из библиотеки");
      },
      createLibrary: async (data) => {
        const response = await fetch("/api/content/library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await readJson<{ item: LibraryItem }>(response);
        await refreshData();
        return result.item;
      },
      updateLibrary: async (id, patch) => {
        const response = await fetch(`/api/content/library/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const result = await readJson<{ item: LibraryItem }>(response);
        await refreshData();
        return result.item;
      },
      createPlace: async (data) => {
        const response = await fetch("/api/content/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await readJson<{ item: MapPlace }>(response);
        await refreshData();
        flash("Место добавлено на карту");
        return result.item;
      },
      updatePlace: async (id, patch) => {
        const response = await fetch(`/api/content/places/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const result = await readJson<{ item: MapPlace }>(response);
        await refreshData();
        flash("Место обновлено");
        return result.item;
      },
      deletePlace: async (id) => {
        const response = await fetch(`/api/content/places/${id}`, { method: "DELETE" });
        await readJson<{ ok: boolean }>(response);
        await refreshData();
        flash("Место удалено");
      },
      saveDraft: async () => {
        let result;
        if (state.addType === "publication") {
          result = await mutateRecord("publications", state.form.entityId, buildPublication(state.form, true));
        } else if (state.addType === "photo") {
          const photos = state.form.attachments || [];
          if (!state.form.entityId && photos.length > 1) {
            await Promise.all(photos.map((file) => {
              const dot = file.name.lastIndexOf(".");
              const title = dot > 0 ? file.name.slice(0, dot) : file.name;
              return mutateRecord("photos", null, {
                ...buildPhoto(state.form, "draft"),
                id: null,
                title,
                imagePath: file.path,
              });
            }));
            await refreshData();
            setState((current) => ({ ...current, form: blankForm(current.addType) }));
            flash("Черновики фотографий сохранены");
            return;
          }
          result = await mutateRecord("photos", state.form.entityId, buildPhoto(state.form, "draft"));
        } else if (state.addType === "topic") {
          result = await mutateRecord("topics", state.form.entityId, buildTopic(state.form));
          await syncTopicFormRelations(result.item.id, state.form);
        } else if (state.addType === "archive") {
          result = await mutateRecord("archive", state.form.entityId, buildArchive(state.form));
        } else {
          result = await mutateRecord("materials", state.form.entityId, buildMaterial(state.form, "draft"));
        }

        await refreshData();

        if (result && result.item && !state.form.entityId) {
          setState((current) => ({
            ...current,
            form: { ...current.form, entityId: result.item.id }
          }));
        }

        flash("Черновик сохранен");
      },
      publishForm: async () => {
        if (state.addType === "publication") {
          await mutateRecord("publications", state.form.entityId, buildPublication(state.form, false));
        } else if (state.addType === "photo") {
          const photos = state.form.attachments || [];
          if (!state.form.entityId && photos.length > 1) {
            await Promise.all(photos.map((file) => {
              const dot = file.name.lastIndexOf(".");
              const title = dot > 0 ? file.name.slice(0, dot) : file.name;
              return mutateRecord("photos", null, {
                ...buildPhoto(state.form, "published"),
                id: null,
                title,
                imagePath: file.path,
              });
            }));
          } else {
            await mutateRecord("photos", state.form.entityId, buildPhoto(state.form, "published"));
          }
        } else if (state.addType === "topic") {
          const result = await mutateRecord("topics", state.form.entityId, buildTopic(state.form));
          await syncTopicFormRelations(result.item.id, state.form);
        } else if (state.addType === "archive") {
          await mutateRecord("archive", state.form.entityId, buildArchive(state.form));
        } else {
          await mutateRecord("materials", state.form.entityId, buildMaterial(state.form, "published"));
        }

        await refreshData();
        setState((current) => ({
          ...current,
          draftAt: null,
          form: blankForm(current.addType),
        }));
        flash("Материал опубликован");
      },
      useTemplate: (type, values) =>
        setState((current) => ({
          ...current,
          addType: type,
          draftAt: Date.now(),
          form: {
            ...blankForm(type),
            ...Object.fromEntries(
              Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1])),
            ),
            entityId: null,
            type,
            tags: values.tags ? values.tags.split(",") : [],
            tagDraft: "",
          },
        })),
      useTagSuggestion: (value) =>
        setState((current) =>
          current.form.tags.includes(value)
            ? current
            : {
                ...current,
                draftAt: Date.now(),
                form: { ...current.form, tags: [...current.form.tags, value] },
              },
        ),
      setAccess: (value) =>
        setState((current) => ({
          ...current,
          form: { ...current.form, access: value },
        })),
      setStatus: (value) =>
        setState((current) => ({
          ...current,
          form: { ...current.form, status: value },
        })),
      refreshData,
      toggleEditMode: () =>
        setState((current) => ({ ...current, editMode: !current.editMode })),
      saveUiText: async (key, value) => {
        // Оптимистичное обновление, чтобы текст менялся мгновенно
        setState((current) => ({
          ...current,
          uiText: { ...current.uiText, [key]: value },
        }));
        const response = await fetch("/api/ui-text", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        const data = await readJson<{ uiText: PortalState["uiText"] }>(response);
        setState((current) => ({ ...current, uiText: data.uiText }));
        flash("Текст сохранён");
      },
      savePage: async (slug, payload) => {
        const response = await fetch(`/api/pages/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await readJson<{ page: SitePages[typeof slug] }>(response);
        await refreshData();
        flash("Страница сохранена");
      },
      uploadFile: async (file, folder) => {
        const formData = new FormData();
        formData.append("file", file);
        const qs = folder && folder.trim() ? `?folder=${encodeURIComponent(folder.trim())}` : "";
        const response = await fetch(`/api/upload${qs}`, {
          method: "POST",
          body: formData,
        });
        return readJson<UploadResult>(response);
      },
      askUploadFolder,
      editItem: (type, item) => {
        setState((current) => {
          const form: FormState = {
            entityId: item.id,
            type: type,
            title: item.title || item.name || "",
            discipline: item.discipline || disciplines[0],
            mtype: item.mtype || "Лекция",
            desc: item.desc || item.summary || "",
            course: item.course || "Бакалавриат, 1 курс",
            year: item.year || "",
            lang: item.language || item.lang || "Русский",
            access: item.access || "open",
            status: item.status || "published",
            filePath: item.filePath || item.pdfPath || null,
            previewPath: item.previewPath || null,
            tags: item.tags || item.keywords || [],
            tagDraft: "",
            authors: item.authors || "",
            journal: item.journal || "",
            doi: item.doi || "",
            externalUrl: item.externalUrl || "",
            pdfPath: item.pdfPath || null,
            pdfPublic: item.pdfPublic ?? true,
            ptype: item.ptype || "Статья",
            summary: item.summary || item.desc || "",
            topic: item.topic || topicOptions[0],
            region: item.region || "",
            age: item.age || "",
            otype: item.otype || "Экспедиция",
            imagePath: item.imagePath || null,
            location: item.location || "",
            author: item.author || "",
            usagePolicy: item.usagePolicy || "",
            groupName: item.group || "",
            body: item.body || "",
            coverPath: item.coverPath || null,
            relatedPublicationIds: item.relatedPublicationIds || [],
            relatedPhotoIds: item.relatedPhotoIds || [],
            relatedMaterialIds: type === "topic"
              ? current.materials.filter((material) => material.relatedTopicIds?.includes(item.id)).map((material) => material.id)
              : [],
            relatedLibraryIds: type === "topic"
              ? current.libraryItems.filter((libraryItem) => libraryItem.relatedTopicIds?.includes(item.id)).map((libraryItem) => libraryItem.id)
              : [],
            relatedMapPlaceIds: type === "topic"
              ? current.mapPlaces.filter((mapPlace) => mapPlace.relatedTopicIds?.includes(item.id)).map((mapPlace) => mapPlace.id)
              : [],
            relatedTopicIds: item.relatedTopicIds?.length
              ? item.relatedTopicIds
              : item.topic
                ? current.topics.filter((topic) => topic.name === item.topic).map((topic) => topic.id)
                : [],
            relatedArchiveIds: item.relatedArchiveIds || [],
            relationReplacements: {},
            ownerComment: item.ownerComment || "",
            featured: item.featured || false,
            attachments: item.attachments || [],
          };

          return {
            ...current,
            addType: type,
            form,
          };
        });
      },
    }),
    [state, isAdminUnlocked],
  );

  return (
    <PortalContext.Provider value={value}>
      {children}
      <FolderPromptDialog open={folderPromptOpen} onResolve={resolveFolder} />
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("usePortal must be used inside PortalProvider");
  }

  return context;
}
