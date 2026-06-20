"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePortal } from "@/components/portal-provider";
import { disciplines, topicOptions, accessLabel } from "@/lib/portal-seed";
import { typeShort, typeTint, materialTypeOrder } from "@/lib/portal-utils";
import { MarkdownEditor } from "@/components/portal-markdown-editor";
import { ComboInput } from "@/components/portal-combo-input";
import { TopicMultiSelect } from "@/components/topic-multi-select";
import { TopicRelationsEditor } from "@/components/topic-relations-editor";
import { FilePicker } from "@/components/file-picker";
import { ExternalLink, FileText, Folder, Paperclip, Sparkles, X } from "lucide-react";
import type { AccessLevel, AddType } from "@/lib/portal-types";

type PdfImportData = {
  error?: string;
  title?: string;
  authors?: string;
  year?: string;
  source?: string;
  doi?: string;
  content?: string;
  images?: string[];
  tables?: number;
  pages?: number;
};

export function AdminAddView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const editType = searchParams.get("type");
  const createRequested = searchParams.get("new") === "1";
  const requestedTopicId = searchParams.get("topic");
  const createRequestRef = useRef("");

  const [uploading, setUploading] = useState(false);
  const [doiImporting, setDoiImporting] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);
  const [doiImportMessage, setDoiImportMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mainPdfPickerOpen, setMainPdfPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainPdfInputRef = useRef<HTMLInputElement>(null);
  const sourceOrderRef = useRef<Array<"doi" | "pdf">>([]);

  const {
    state,
    setAddLayout,
    setAddType,
    updateForm,
    addTag,
    removeTag,
    useTagSuggestion,
    setAccess,
    saveDraft,
    publishForm,
    editItem,
    uploadFile,
    askUploadFolder,
  } = usePortal();

  function setRelatedTopics(ids: string[]) {
    updateForm("relatedTopicIds", ids);
    const firstTopic = state.topics.find((topic) => topic.id === ids[0]);
    updateForm("topic", firstTopic?.name || "");
  }

  // Загрузка с обязательным вопросом «в какую папку?»
  async function uploadWithPrompt(file: File) {
    const folder = await askUploadFolder();
    if (folder === null) throw new Error("cancelled");
    return uploadFile(file, folder);
  }

  useEffect(() => {
    if (editId && editType && state.loaded) {
      const foundItem =
        editType === "learning"
          ? state.materials.find((x) => x.id === editId)
          : editType === "publication"
            ? state.publications.find((x) => x.id === editId)
            : editType === "photo"
              ? state.photos.find((x) => x.id === editId)
              : editType === "topic"
                ? state.topics.find((x) => x.id === editId)
                : editType === "archive"
                  ? state.archiveItems.find((x) => x.id === editId)
                  : null;
      if (foundItem) {
        editItem(editType as AddType, foundItem);
      }
    } else if (!editId && !editType) {
      if (state.form.entityId !== null) {
        setAddType(state.addType);
      }
    }
  }, [
    editId,
    editType,
    state.loaded,
    state.materials,
    state.publications,
    state.photos,
    state.topics,
    state.archiveItems,
  ]);

  useEffect(() => {
    if (!createRequested || !editType || !state.loaded) return;
    if (!(["learning", "publication", "photo", "archive"] as string[]).includes(editType)) return;
    const requestKey = `${editType}:${requestedTopicId || ""}`;
    if (createRequestRef.current === requestKey) return;
    createRequestRef.current = requestKey;
    setAddType(editType as AddType);
    if (requestedTopicId && state.topics.some((topic) => topic.id === requestedTopicId)) {
      updateForm("relatedTopicIds", [requestedTopicId]);
      const topic = state.topics.find((item) => item.id === requestedTopicId);
      updateForm("topic", topic?.name || "");
    }
  }, [createRequested, editType, requestedTopicId, state.loaded, state.topics]);



  const tagSuggestionPool =
    state.addType === "publication"
      ? ["стратиграфия", "пермь", "карбон", "нефть", "региональная геология"]
      : state.addType === "photo"
        ? ["экспедиция", "обнажение", "образец", "керн", "практика"]
        : ["палеонтология", "стратиграфия", "двустворки", "керн", "пермь", "карбон"];

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const folder = await askUploadFolder();
    if (folder === null) {
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      if (["publication", "learning", "archive"].includes(state.addType)) {
        const currentAttachments = state.form.attachments || [];
        const newAttachments = [...currentAttachments];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const res = await handleUpload(file, folder);
          if (res) {
            newAttachments.push({ name: file.name, path: res.path, size: file.size });
            if ((state.addType === "learning" || state.addType === "archive") && !state.form.filePath) {
              updateForm("filePath", res.path);
            }
            if ((state.addType === "archive" || state.addType === "learning") && file.name.toLowerCase().endsWith(".pdf")) {
              void processPdfForAutofill(res.path, state.addType);
            }
          }
        }
        updateForm("attachments", newAttachments);
      } else if (state.addType === "photo") {
        const uploaded = [...(state.form.attachments || [])];
        for (const file of Array.from(files)) {
          const res = await handleUpload(file, folder);
          if (res) uploaded.push({ name: file.name, path: res.path, size: file.size });
        }
        if (uploaded.length > 0) {
          updateForm("attachments", uploaded);
          updateForm("imagePath", uploaded[0].path);
          if (!state.form.title && uploaded.length === 1) {
            const fileName = uploaded[0].name;
            updateForm("title", fileName.substring(0, fileName.lastIndexOf(".")) || fileName);
          }
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  }

  async function handleUpload(file: File, folder?: string) {
    try {
      return await uploadFile(file, folder);
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const folder = await askUploadFolder();
    if (folder === null) return;

    setUploading(true);
    try {
      if (["publication", "learning", "archive"].includes(state.addType)) {
        const currentAttachments = state.form.attachments || [];
        const newAttachments = [...currentAttachments];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const res = await handleUpload(file, folder);
          if (res) {
            newAttachments.push({ name: file.name, path: res.path, size: file.size });
            if ((state.addType === "learning" || state.addType === "archive") && !state.form.filePath) {
              updateForm("filePath", res.path);
            }
            if ((state.addType === "archive" || state.addType === "learning") && file.name.toLowerCase().endsWith(".pdf")) {
              void processPdfForAutofill(res.path, state.addType);
            }
          }
        }
        updateForm("attachments", newAttachments);
      } else if (state.addType === "photo") {
        const uploaded = [...(state.form.attachments || [])];
        for (const file of Array.from(files)) {
          const res = await handleUpload(file, folder);
          if (res) uploaded.push({ name: file.name, path: res.path, size: file.size });
        }
        if (uploaded.length > 0) {
          updateForm("attachments", uploaded);
          updateForm("imagePath", uploaded[0].path);
          if (!state.form.title && uploaded.length === 1) {
            const fileName = uploaded[0].name;
            updateForm("title", fileName.substring(0, fileName.lastIndexOf(".")) || fileName);
          }
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  }

  function handlePickedFile(webPath: string) {
    const fileName = webPath.split("/").pop() ?? webPath;
    if (state.addType === "photo") {
      updateForm("imagePath", webPath);
      const current = state.form.attachments || [];
      if (!current.find((a) => a.path === webPath)) {
        updateForm("attachments", [...current, { name: fileName, path: webPath, size: 0 }]);
      }
    } else if (["learning", "archive"].includes(state.addType)) {
      if ((state.addType === "learning" || state.addType === "archive") && !state.form.filePath) {
        updateForm("filePath", webPath);
      }
      const current = state.form.attachments || [];
      if (!current.find((a) => a.path === webPath)) {
        updateForm("attachments", [...current, { name: fileName, path: webPath, size: 0 }]);
      }
      if (fileName.toLowerCase().endsWith(".pdf")) {
        void processPdfForAutofill(webPath, state.addType as "archive" | "learning");
      }
    } else if (state.addType === "publication") {
      const current = state.form.attachments || [];
      if (!current.find((a) => a.path === webPath)) {
        updateForm("attachments", [...current, { name: fileName, path: webPath, size: 0 }]);
      }
    }
  }

  function go(href: string) {
    router.push(href);
  }

  function onTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(state.form.tagDraft);
    }
    if (
      event.key === "Backspace" &&
      !state.form.tagDraft &&
      state.form.tags.length > 0
    ) {
      removeTag(state.form.tags[state.form.tags.length - 1]);
    }
  }

  function rememberSource(source: "doi" | "pdf") {
    if (!sourceOrderRef.current.includes(source)) sourceOrderRef.current.push(source);
  }

  async function applyDoiImport(doi: string, options: { keepSummary?: boolean } = {}) {
      const response = await fetch(`/api/doi?doi=${encodeURIComponent(doi)}`);
      const data = await response.json() as {
        error?: string;
        title?: string;
        authors?: string;
        year?: string;
        journal?: string;
        ptype?: string;
        doi?: string;
        externalUrl?: string;
        summary?: string;
        keywords?: string[];
        language?: string;
        missing?: string[];
      };
      if (!response.ok) throw new Error(data.error || "Не удалось найти публикацию");

      if (data.title) updateForm("title", data.title);
      if (data.authors) updateForm("authors", data.authors);
      if (data.year) updateForm("year", data.year);
      if (data.journal) updateForm("journal", data.journal);
      if (data.ptype) updateForm("ptype", data.ptype);
      if (data.doi) updateForm("doi", data.doi);
      if (data.externalUrl) updateForm("externalUrl", data.externalUrl);
      if (data.summary && !options.keepSummary) updateForm("summary", data.summary);
      if (data.keywords?.length) updateForm("tags", data.keywords);
      if (data.language) updateForm("lang", data.language);
      return { missing: data.missing ?? [] };
  }

  async function applyPdfImport(webPath: string, type: "publication" | "archive" | "learning", contentOnly = false) {
    const response = await fetch("/api/pdf-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: webPath }),
    });
    const data = await response.json() as PdfImportData;
    if (!response.ok) throw new Error(data.error || "Не удалось разобрать PDF");
    if (!data.content || data.content.length < 100) throw new Error("В PDF не найден извлекаемый текст");

    if (!contentOnly && data.title) updateForm("title", data.title);
    if (!contentOnly && data.year) updateForm("year", data.year);
    
    let textToInsert = data.content;
    if (textToInsert.length > 1000) {
      textToInsert = textToInsert.substring(0, 1000) + "...";
    }

    if (type === "publication") {
      if (!contentOnly && data.authors) updateForm("authors", data.authors);
      if (!contentOnly && data.source) updateForm("journal", data.source);
      if (!contentOnly && data.doi) updateForm("doi", data.doi);
      updateForm("summary", data.content);
    } else {
      updateForm("desc", textToInsert);
    }
    return data;
  }

  async function runPublicationAutofill(overrides: { doi?: string; pdfPath?: string } = {}) {
    const doi = overrides.doi ?? state.form.doi.trim();
    const pdfPath = overrides.pdfPath ?? state.form.pdfPath ?? "";
    if (!doi && !pdfPath) {
      setDoiImportMessage({ kind: "error", text: "Сначала укажите DOI или загрузите основной PDF" });
      return;
    }

    const available = sourceOrderRef.current.filter((source) => source === "doi" ? Boolean(doi) : Boolean(pdfPath));
    for (const source of ["doi", "pdf"] as const) {
      if ((source === "doi" ? doi : pdfPath) && !available.includes(source)) available.push(source);
    }

    setDoiImporting(true);
    setPdfImporting(true);
    setDoiImportMessage(null);
    const errors: string[] = [];
    try {
      for (const source of available) {
        try {
          if (source === "doi") {
            const result = await applyDoiImport(doi);
            let enrichment = "";
            if (pdfPath) {
              try {
                const pdf = await applyPdfImport(pdfPath, "publication", true);
                enrichment = ` Текст дополнен из PDF: ${pdf.tables ?? 0} табл., ${pdf.images?.length ?? 0} изображений.`;
              } catch {
                enrichment = " Основной PDF сохранён, но его содержимое не удалось перенести.";
              }
            }
            setDoiImportMessage({ kind: "ok", text: (result.missing.length ? `Заполнено по DOI. Не найдено: ${result.missing.join(", ")}.` : "Все доступные поля заполнены по DOI.") + enrichment });
          } else {
            const result = await applyPdfImport(pdfPath, "publication");
            let enrichment = "";
            if (result.doi) {
              try {
                await applyDoiImport(result.doi, { keepSummary: true });
                enrichment = " Библиография уточнена по DOI, найденному внутри PDF.";
              } catch {
                enrichment = " DOI найден в PDF, но внешний реестр не ответил.";
              }
            }
            setDoiImportMessage({ kind: "ok", text: `Заполнено из основного PDF: ${result.pages ?? 0} стр., ${result.tables ?? 0} табл., ${result.images?.length ?? 0} изображений.${enrichment}` });
          }
          return;
        } catch (error) {
          errors.push(`${source === "doi" ? "DOI" : "PDF"}: ${error instanceof Error ? error.message : "ошибка"}`);
        }
      }
      setDoiImportMessage({ kind: "error", text: errors.join("; ") });
    } finally {
      setDoiImporting(false);
      setPdfImporting(false);
    }
  }

  async function importByDoi() {
    rememberSource("doi");
    await runPublicationAutofill();
  }

  async function processPdfForAutofill(webPath: string, type: "archive" | "learning") {
    setPdfImporting(true);
    setDoiImportMessage(null);
    try {
      const result = await applyPdfImport(webPath, type);
      setDoiImportMessage({ kind: "ok", text: `Текст и данные перенесены из PDF: ${result.pages ?? 0} стр.` });
    } catch (error) {
      setDoiImportMessage({ kind: "error", text: error instanceof Error ? error.message : "Ошибка извлечения данных из PDF" });
    } finally {
      setPdfImporting(false);
    }
  }

  async function handleMainPdfPath(webPath: string) {
    rememberSource("pdf");
    if (state.addType === "publication") {
      updateForm("pdfPath", webPath);
      await runPublicationAutofill({ pdfPath: webPath });
    }
  }

  async function handleMainPdfUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const folder = await askUploadFolder();
    if (folder === null) return;
    setUploading(true);
    try {
      const result = await uploadFile(file, folder);
      await handleMainPdfPath(result.path);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="route">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <button className="icon-button" onClick={() => go("/admin")}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div className="section-kicker">{state.form.entityId ? "Редактирование" : "Новый материал"}</div>
          <h1 className="page-title" style={{ fontSize: 30, fontWeight: 500, margin: 0 }}>
            {state.form.entityId ? "Изменить ресурс" : "Быстрое добавление"}
          </h1>
        </div>
        <div className="segmented">
          {[
            ["split", "С ПРЕВЬЮ"],
            ["focus", "ФОКУС"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`segmented-pill ${state.addLayout === key ? "active" : ""}`}
              onClick={() => setAddLayout(key as "split" | "focus")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!state.form.entityId && (
        <div className="tab-row">
          {[
            ["learning", "Учебный материал"],
            ["publication", "Публикация"],
            ["photo", "Фотография"],
            ["topic", "Научная тема"],
            ["archive", "Архивный документ"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`tab-button ${state.addType === key ? "active" : ""}`}
              onClick={() => setAddType(key as AddType)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div
        className="two-col-page"
        style={
          state.addLayout === "focus"
            ? { gridTemplateColumns: "1fr" }
            : undefined
        }
      >
        <div>
          {state.addType !== "topic" && (
          <div
            className="drop-zone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
          >
            <input
              type="file"
              multiple={["publication", "learning", "archive", "photo"].includes(state.addType)}
              accept={state.addType === "photo" ? "image/*" : undefined}
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {uploading ? (
              <div>
                <div className="pulse-dot" style={{ width: 12, height: 12, margin: "0 auto 12px" }} />
                <div style={{ fontWeight: 600, fontSize: 15 }}>Загрузка файлов...</div>
              </div>
            ) : state.addType === "photo" && state.form.imagePath ? (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={state.form.imagePath}
                  alt="Превью"
                  style={{ maxHeight: 120, objectFit: "contain", borderRadius: 6, marginBottom: 8 }}
                />
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Нажмите или перетащите для замены фото</div>
              </div>
            ) : ["learning", "archive"].includes(state.addType) && state.form.filePath ? (
              <div>
                <div style={{ marginBottom: 8, color: "var(--muted)", display: "flex", justifyContent: "center" }}><FileText size={40} strokeWidth={1.2} /></div>
                <div style={{ fontWeight: 600, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 300, margin: "0 auto" }}>
                  {state.form.filePath.split("/").pop()}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Нажмите или перетащите для добавления файлов</div>
              </div>
            ) : (
              <div>
                <div className="drop-zone-circle">+</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {state.addType === "photo"
                    ? "Перетащите одну или несколько фотографий"
                    : "Перетащите файлы приложений или нажмите для выбора"}
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                  {state.addType === "photo"
                    ? "Одно или сразу много фото — все попадут в выбранный альбом"
                    : "PDF, PPTX, DOCX, XLSX, ZIP и др. — можно выбрать несколько"}
                </div>
              </div>
            )}
          </div>
          )}

          {state.addType !== "topic" && (
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {pdfImporting && <span style={{ fontSize: 12, color: "var(--muted)" }}>Извлечение данных из PDF...</span>}
                {!pdfImporting && doiImportMessage && ["archive", "learning"].includes(state.addType) && (
                  <span style={{ fontSize: 12, color: doiImportMessage.kind === "ok" ? "var(--forest2)" : "var(--red)" }}>
                    {doiImportMessage.text}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="secondary-button"
                style={{ fontSize: 12, padding: "5px 12px" }}
                onClick={() => setPickerOpen(true)}
              >
                <Folder size={13} strokeWidth={1.8} style={{ marginRight: 5 }} /> Выбрать из загруженных
              </button>
            </div>
          )}

          {["publication", "learning", "archive", "photo"].includes(state.addType) && state.form.attachments && state.form.attachments.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label className="field-label">
                {state.addType === "photo" ? "Выбранные фотографии" : "Загруженные приложения"} ({state.form.attachments.length})
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {state.form.attachments.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "var(--line2)",
                      padding: "6px 10px",
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Paperclip size={13} strokeWidth={1.8} style={{ marginRight: 5, flexShrink: 0 }} />{file.name}
                    </span>
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--red)",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 16,
                        padding: "0 6px",
                      }}
                      onClick={() => {
                        const updated = state.form.attachments.filter((_, i) => i !== idx);
                        updateForm("attachments", updated);
                        if (state.addType === "photo") updateForm("imagePath", updated[0]?.path ?? null);
                        if (["learning", "archive"].includes(state.addType) && state.form.filePath === file.path) {
                          updateForm("filePath", updated[0]?.path ?? null);
                        }
                      }}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <label className="field-label">
              {state.addType === "photo" && state.form.attachments.length > 1 ? "Название (для одиночного фото)" : "Название"}
            </label>
            <input
              className="text-input"
              placeholder="Напр. Введение в палеонтологию"
              value={state.form.title}
              onChange={(event) => updateForm("title", event.target.value)}
            />
          </div>

          {state.addType === "learning" ? (
            <Fragment>
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Дисциплина</label>
                  <ComboInput
                    value={state.form.discipline}
                    onChange={(v) => updateForm("discipline", v)}
                    suggestions={[...new Set([...disciplines, ...state.materials.map((m) => m.discipline)])]}
                    placeholder="Выберите или введите новую..."
                  />
                </div>
                <div>
                  <label className="field-label">Тип материала</label>
                  <ComboInput
                    value={state.form.mtype}
                    onChange={(v) => updateForm("mtype", v)}
                    suggestions={[...new Set([...materialTypeOrder, ...state.materials.map((m) => m.mtype)])]}
                    placeholder="Выберите или введите новый..."
                  />
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="field-label">Краткое описание</label>
                <textarea
                  className="text-area"
                  placeholder="Что внутри, для кого, как использовать..."
                  value={state.form.desc}
                  onChange={(event) => updateForm("desc", event.target.value)}
                  maxLength={1000}
                  style={{ minHeight: 120 }}
                />
              </div>

              <div className="form-grid-three" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Курс / уровень</label>
                  <ComboInput
                    value={state.form.course}
                    onChange={(v) => updateForm("course", v)}
                    suggestions={[...new Set([
                      "Бакалавриат, 1 курс",
                      "Бакалавриат, 2 курс",
                      "Бакалавриат, 3 курс",
                      "Бакалавриат, 4 курс",
                      "Магистратура",
                      ...state.materials.map((m) => m.course ?? "").filter(Boolean),
                    ])]}
                    placeholder="Выберите или введите..."
                  />
                </div>
                <div>
                  <label className="field-label">Год</label>
                  <input
                    className="text-input"
                    value={state.form.year}
                    onChange={(event) => updateForm("year", event.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Язык</label>
                  <select
                    className="select-input"
                    value={state.form.lang}
                    onChange={(event) => updateForm("lang", event.target.value)}
                  >
                    <option>Русский</option>
                    <option>English</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="field-label">Научные темы</label>
                <TopicMultiSelect topics={state.topics} selected={state.form.relatedTopicIds} onChange={setRelatedTopics} />
              </div>
            </Fragment>
          ) : null}

          {state.addType === "publication" ? (
            <Fragment>
              <div style={{ marginTop: 16, padding: 16, border: "2px solid var(--clay)", borderRadius: 10, background: "var(--paper)" }}>
                <div className="field-label" style={{ color: "var(--clay)" }}>Основной PDF публикации</div>
                <div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 10px" }}>
                  Хранится отдельно от приложений и используется для переноса текста, таблиц и изображений.
                </div>
                <input ref={mainPdfInputRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }} onChange={handleMainPdfUpload} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  {state.form.pdfPath ? (
                    <>
                      <a href={state.form.pdfPath} target="_blank" rel="noopener noreferrer" className="secondary-button" style={{ textDecoration: "none" }}>Открыть основной PDF</a>
                      <button type="button" className="secondary-button" onClick={() => void runPublicationAutofill()} disabled={pdfImporting || doiImporting}>
                        <Sparkles size={14} style={{ marginRight: 5 }} /> Перезаполнить
                      </button>
                      <button type="button" className="icon-button" onClick={() => updateForm("pdfPath", null)} title="Убрать основной PDF"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="secondary-button" onClick={() => mainPdfInputRef.current?.click()} disabled={uploading}>↑ Загрузить основной PDF</button>
                      <button type="button" className="secondary-button" onClick={() => setMainPdfPickerOpen(true)}><Folder size={13} style={{ marginRight: 5 }} /> Из загруженных</button>
                    </>
                  )}
                  {(uploading || pdfImporting) && <span style={{ fontSize: 12, color: "var(--muted)" }}>{uploading ? "Загрузка…" : "Разбираю PDF…"}</span>}
                </div>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 13, paddingTop: 12, borderTop: "1px solid var(--line)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={state.form.pdfPublic}
                    onChange={(event) => updateForm("pdfPublic", event.target.checked)}
                    style={{ marginTop: 2 }}
                  />
                  <span>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>Показывать основной PDF и разрешать скачивание</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>Если выключено, файл доступен только в админке. Приложения настраиваются отдельно.</span>
                  </span>
                </label>
              </div>
              <div style={{ marginTop: 16, padding: 16, border: "1px solid var(--line)", borderRadius: 10, background: "var(--sand)" }}>
                <label className="field-label">DOI — автоматическое заполнение</label>
                <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                  <input
                    className="text-input"
                    placeholder="10.1000/example или https://doi.org/..."
                    value={state.form.doi}
                    onChange={(event) => {
                      if (event.target.value.trim()) rememberSource("doi");
                      updateForm("doi", event.target.value);
                      setDoiImportMessage(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void importByDoi();
                      }
                    }}
                  />
                  <button type="button" className="primary-button" onClick={importByDoi} disabled={doiImporting} style={{ whiteSpace: "nowrap" }}>
                    <Sparkles size={14} strokeWidth={1.8} style={{ marginRight: 6 }} />
                    {doiImporting ? "Ищу…" : "Заполнить по DOI"}
                  </button>
                </div>
                {state.form.doi && /^\s*(?:https?:\/\/(?:dx\.)?doi\.org\/)?10\.\d{4,9}\//i.test(state.form.doi) && (
                  <a href={state.form.doi.startsWith("http") ? state.form.doi : `https://doi.org/${state.form.doi.replace(/^doi:\s*/i, "")}`} target="_blank" rel="noopener noreferrer" className="panel-link" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12 }}>
                    Проверить DOI <ExternalLink size={12} />
                  </a>
                )}
                {doiImportMessage && (
                  <div style={{ marginTop: 8, fontSize: 12, color: doiImportMessage.kind === "ok" ? "var(--forest2)" : "var(--red)" }}>
                    {doiImportMessage.text}
                  </div>
                )}
              </div>
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Авторы</label>
                  <input
                    className="text-input"
                    value={state.form.authors}
                    onChange={(event) => updateForm("authors", event.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Тип публикации</label>
                  <ComboInput
                    value={state.form.ptype}
                    onChange={(v) => updateForm("ptype", v)}
                    suggestions={[...new Set([
                      "Статья",
                      "Монография",
                      "Тезисы",
                      "Учебное пособие",
                      ...state.publications.map((p) => p.ptype),
                    ])]}
                    placeholder="Выберите или введите новый..."
                  />
                </div>
              </div>
              <div className="form-grid-three" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Журнал / издательство</label>
                  <input
                    className="text-input"
                    value={state.form.journal}
                    onChange={(event) => updateForm("journal", event.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Год</label>
                  <input
                    className="text-input"
                    value={state.form.year}
                    onChange={(event) => updateForm("year", event.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Внешний сайт</label>
                  <input
                    className="text-input"
                    type="url"
                    placeholder="https://сайт-издателя/..."
                    value={state.form.externalUrl}
                    onChange={(event) => updateForm("externalUrl", event.target.value)}
                  />
                </div>
              </div>
              <div className="form-grid-three" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Научные темы</label>
                  <TopicMultiSelect topics={state.topics} selected={state.form.relatedTopicIds} onChange={setRelatedTopics} />
                </div>
                <div>
                  <label className="field-label">Регион</label>
                  <input
                    className="text-input"
                    value={state.form.region}
                    onChange={(event) => updateForm("region", event.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Геологический возраст</label>
                  <input
                    className="text-input"
                    placeholder="Напр. Девон, карбон"
                    value={state.form.age}
                    onChange={(event) => updateForm("age", event.target.value)}
                  />
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="field-label">Аннотация / Текст статьи</label>
                <MarkdownEditor
                  value={state.form.summary}
                  onChange={(v) => updateForm("summary", v)}
                  onUploadFile={uploadWithPrompt}
                  placeholder="Введите текст аннотации в формате Markdown..."
                  minHeight={220}
                />
              </div>
            </Fragment>
          ) : null}

          {state.addType === "photo" ? (
            <Fragment>
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Папка / альбом</label>
                  <ComboInput
                    value={state.form.groupName}
                    onChange={(value) => updateForm("groupName", value)}
                    suggestions={[...new Set(state.photos.map((photo) => photo.group).filter(Boolean))]}
                    placeholder="Выберите альбом или введите название нового"
                  />
                </div>
                <div>
                  <label className="field-label">Научные темы</label>
                  <TopicMultiSelect topics={state.topics} selected={state.form.relatedTopicIds} onChange={setRelatedTopics} />
                </div>
              </div>
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Тип объекта</label>
                  <ComboInput
                    value={state.form.otype}
                    onChange={(v) => updateForm("otype", v)}
                    suggestions={[...new Set([
                      "Экспедиция",
                      "Обнажение",
                      "Керн",
                      "Образец",
                      "Ископаемое",
                      "Шлиф",
                      ...state.photos.map((p) => p.otype),
                    ])]}
                    placeholder="Выберите или введите новый..."
                  />
                </div>
                <div>
                  <label className="field-label">Год</label>
                  <input
                    className="text-input"
                    value={state.form.year}
                    onChange={(event) => updateForm("year", event.target.value)}
                  />
                </div>
              </div>
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Регион</label>
                  <input
                    className="text-input"
                    value={state.form.region}
                    onChange={(event) => updateForm("region", event.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Краткое описание</label>
                  <input
                    className="text-input"
                    value={state.form.desc}
                    onChange={(event) => updateForm("desc", event.target.value)}
                  />
                </div>
              </div>
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Место съёмки</label>
                  <input className="text-input" value={state.form.location} onChange={(event) => updateForm("location", event.target.value)} />
                </div>
                <div>
                  <label className="field-label">Геологический возраст</label>
                  <input className="text-input" value={state.form.age} onChange={(event) => updateForm("age", event.target.value)} />
                </div>
              </div>
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Автор фотографий</label>
                  <input className="text-input" value={state.form.author} onChange={(event) => updateForm("author", event.target.value)} />
                </div>
                <div>
                  <label className="field-label">Условия использования</label>
                  <input className="text-input" value={state.form.usagePolicy} onChange={(event) => updateForm("usagePolicy", event.target.value)} />
                </div>
              </div>
              {state.form.attachments.length > 1 && (
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
                  Для нескольких файлов названия будут взяты из имён файлов. Остальные поля применятся ко всем фотографиям.
                </div>
              )}
            </Fragment>
          ) : null}

          {state.addType === "topic" ? (
            <Fragment>
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Регион исследования</label>
                  <input
                    className="text-input"
                    placeholder="Напр. Среднее Поволжье"
                    value={state.form.region}
                    onChange={(event) => updateForm("region", event.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Геологический возраст</label>
                  <input
                    className="text-input"
                    placeholder="Напр. Пермь"
                    value={state.form.age}
                    onChange={(event) => updateForm("age", event.target.value)}
                  />
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="field-label">Краткое описание</label>
                <textarea
                  className="text-area"
                  placeholder="Коротко о сути научных исследований по данной теме..."
                  value={state.form.desc}
                  onChange={(event) => updateForm("desc", event.target.value)}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="field-label">Подробное описание / Статья темы</label>
                <MarkdownEditor
                  value={state.form.body}
                  onChange={(v) => updateForm("body", v)}
                  onUploadFile={uploadWithPrompt}
                  placeholder="Введите подробный текст в формате Markdown..."
                  minHeight={320}
                />
              </div>
              <TopicRelationsEditor />
            </Fragment>
          ) : null}

          {state.addType === "archive" ? (
            <Fragment>
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Тип документа</label>
                  <input
                    className="text-input"
                    placeholder="Напр. Полевой дневник, Схема"
                    value={state.form.mtype}
                    onChange={(event) => updateForm("mtype", event.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Год</label>
                  <input
                    className="text-input"
                    placeholder="Напр. 1987"
                    value={state.form.year}
                    onChange={(event) => updateForm("year", event.target.value)}
                  />
                </div>
              </div>
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label">Регион</label>
                  <input
                    className="text-input"
                    placeholder="Напр. Среднее Поволжье"
                    value={state.form.region}
                    onChange={(event) => updateForm("region", event.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Научные темы</label>
                  <TopicMultiSelect topics={state.topics} selected={state.form.relatedTopicIds} onChange={setRelatedTopics} />
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="field-label">Описание документа</label>
                <textarea
                  className="text-area"
                  placeholder="Введите описание или перенесите его из основного PDF (макс. ~2 абзаца)..."
                  value={state.form.desc}
                  onChange={(event) => updateForm("desc", event.target.value)}
                  maxLength={1000}
                  style={{ minHeight: 120 }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="field-label">Комментарий владельца (не публичный)</label>
                <input
                  className="text-input"
                  placeholder="Напр. Оригинал хранится в кабинете 204"
                  value={state.form.ownerComment}
                  onChange={(event) => updateForm("ownerComment", event.target.value)}
                />
              </div>
            </Fragment>
          ) : null}

          <div style={{ marginTop: 16 }}>
            <label className="field-label">Теги</label>
            <input
              className="text-input"
              placeholder="добавить тег и Enter..."
              value={state.form.tagDraft}
              onChange={(event) => updateForm("tagDraft", event.target.value)}
              onKeyDown={onTagKeyDown}
            />
            {state.form.tags.length > 0 ? (
              <div className="tag-wrap">
                {state.form.tags.map((item) => (
                  <span key={item} className="tag-chip">
                    {item}
                    <button onClick={() => removeTag(item)}><X size={11} strokeWidth={2.5} /></button>
                  </span>
                ))}
              </div>
            ) : null}
            <div className="tag-wrap">
              {tagSuggestionPool
                .filter((item) => !state.form.tags.includes(item))
                .slice(0, 6)
                .map((item) => (
                  <button
                    key={item}
                    className="tag-suggestion"
                    onClick={() => useTagSuggestion(item)}
                  >
                    + {item}
                  </button>
                ))}
            </div>
          </div>

          <div className="actions-row" style={{ marginTop: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="field-label">Уровень доступа</label>
              <select
                className="select-input"
                value={state.form.access}
                onChange={(event) => setAccess(event.target.value as AccessLevel)}
              >
                <option value="open">Открыто — виден всем</option>
                <option value="students">Только студентам</option>
                <option value="link">По ссылке</option>
                <option value="request">По запросу</option>
                <option value="owner">Только владелец</option>
              </select>
            </div>
          </div>

          <div className="actions-row" style={{ marginTop: 20 }}>
            <button className="secondary-button" onClick={saveDraft}>
              Сохранить черновик
            </button>
            <button
              className="primary-button"
              onClick={publishForm}
              disabled={state.addType !== "topic" && state.form.relatedTopicIds.length === 0}
              title={state.addType !== "topic" && state.form.relatedTopicIds.length === 0 ? "Выберите хотя бы одну научную тему" : undefined}
            >
              Опубликовать →
            </button>
          </div>
          {state.addType !== "topic" && state.form.relatedTopicIds.length === 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--red)", textAlign: "right" }}>
              Для публикации выберите хотя бы одну научную тему.
            </div>
          )}
        </div>

        {state.addLayout === "split" ? (
          <div>
            <div className="section-kicker" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              Так увидят на сайте
            </div>

            {/* ── Учебный материал ── */}
            {state.addType === "learning" && (
              <Fragment>
                <div className="item-card" style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "14px 18px 0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="type-chip" style={{ background: typeTint(state.form.mtype)[0], color: typeTint(state.form.mtype)[1] }}>
                      {typeShort(state.form.mtype)}
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{state.form.year}</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 18px 16px" }}>
                    <h3 className="panel-title clamp-2" style={{ fontSize: 17, lineHeight: 1.3, marginBottom: 8 }}>
                      {state.form.title || "Название материала"}
                    </h3>
                    <p className="clamp-3" style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: "var(--forest2)", margin: 0 }}>
                      {state.form.desc || "Краткое описание появится здесь по мере заполнения."}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--line2)", paddingTop: 11, marginTop: 12 }}>
                      <span className="mono" style={{ fontSize: 11, color: "var(--clay)" }}>↓ Скачать</span>
                      <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{accessLabel(state.form.access)}</span>
                    </div>
                  </div>
                </div>
                <div className="preview-note">Студентам → {state.form.discipline} → {typeShort(state.form.mtype)}.</div>
              </Fragment>
            )}

            {/* ── Публикация ── */}
            {state.addType === "publication" && (
              <Fragment>
                <div className="item-card" style={{ display: "flex", flexDirection: "column" }}>
                  <div className="mono" style={{ fontSize: 11, color: "var(--clay)", marginBottom: 10, flexShrink: 0 }}>
                    {state.form.year || "2026"} · {state.form.ptype || "Статья"}
                  </div>
                  <h3 className="panel-title clamp-3" style={{ fontSize: 20, lineHeight: 1.25, flex: 1, marginBottom: 12 }}>
                    {state.form.title || "Название публикации"}
                  </h3>
                  <div style={{ marginTop: "auto", flexShrink: 0 }}>
                    <div className="clamp-1" style={{ fontSize: 13, color: "var(--forest2)", marginBottom: 4 }}>
                      {state.form.authors || "Авторы"}
                    </div>
                    <div className="clamp-1" style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)" }}>
                      {state.form.journal || "Издание / журнал"}
                    </div>
                  </div>
                </div>
                <div className="preview-note">Публикации → {state.form.ptype || "Статья"}.</div>
              </Fragment>
            )}

            {/* ── Фотография ── */}
            {state.addType === "photo" && (
              <Fragment>
                <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", background: "var(--paper)" }}>
                  <div style={{
                    aspectRatio: "4 / 3",
                    background: state.form.imagePath
                      ? `url(${state.form.imagePath}) center/cover no-repeat`
                      : "repeating-linear-gradient(135deg, #b9a98b, #b9a98b 13px, rgba(255,255,255,.16) 13px, rgba(255,255,255,.16) 26px)",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: 10,
                  }}>
                    <span className="type-chip" style={{ background: "rgba(20,18,16,.62)", color: "#fff" }}>
                      {state.form.otype || "Тип объекта"}
                    </span>
                  </div>
                  <div style={{ padding: "12px 14px 14px" }}>
                    <div className="panel-title clamp-2" style={{ fontSize: 16, lineHeight: 1.35, marginBottom: 6 }}>
                      {state.form.title || "Название фотографии"}
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                      {[state.form.region, state.form.year].filter(Boolean).join(" · ") || "Регион · Год"}
                    </div>
                  </div>
                </div>
                <div className="preview-note">Фотоархив → {state.form.groupName || "Альбом"}.</div>
              </Fragment>
            )}

            {/* ── Научная тема ── */}
            {state.addType === "topic" && (
              <Fragment>
                <div className="topic-card" style={{ color: "inherit", textAlign: "left" }}>
                  {(state.form.age || state.form.region) && (
                    <div style={{ display: "flex", gap: 9, marginBottom: 13, flexShrink: 0 }}>
                      {state.form.age && (
                        <span className="mono" style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: "var(--sand)" }}>
                          {state.form.age}
                        </span>
                      )}
                      {state.form.region && (
                        <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                          {state.form.region}
                        </span>
                      )}
                    </div>
                  )}
                  <h3 className="panel-title clamp-2" style={{ fontSize: 22, lineHeight: 1.2, marginBottom: 10 }}>
                    {state.form.title || "Название научной темы"}
                  </h3>
                  <p className="clamp-3" style={{ flex: 1, fontSize: 14, lineHeight: 1.55, color: "var(--forest2)", margin: "0 0 14px" }}>
                    {state.form.desc || "Краткое описание темы появится здесь по мере заполнения."}
                  </p>
                  <div className="mono" style={{ fontSize: 11, color: "var(--clay)", marginTop: "auto" }}>
                    0 публ. · 0 фото · 0 архив
                  </div>
                </div>
                <div className="preview-note">Научная работа → Научные темы.</div>
              </Fragment>
            )}

            {/* ── Архивный документ ── */}
            {state.addType === "archive" && (
              <Fragment>
                <div style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 18, background: "var(--paper)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span className="type-chip" style={{ background: "var(--sand)", color: "var(--ink)", flexShrink: 0 }}>
                      {state.form.mtype || "Документ"}
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{state.form.year}</span>
                  </div>
                  <div className="panel-title clamp-2" style={{ fontSize: 17, marginBottom: 8 }}>
                    {state.form.title || "Название документа"}
                  </div>
                  {state.form.desc ? (
                    <p className="clamp-2" style={{ fontSize: 13, color: "var(--forest2)", margin: "0 0 10px" }}>
                      {state.form.desc}
                    </p>
                  ) : null}
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                    {[state.form.region, state.form.topic].filter(Boolean).join(" · ") || "Регион · Тема"}
                  </div>
                </div>
                <div className="preview-note">Архив материалов → {state.form.topic || "Тема"}.</div>
              </Fragment>
            )}
          </div>
        ) : null}
      </div>

      {pickerOpen && (
        <FilePicker
          accept={state.addType === "photo" ? "image/*" : undefined}
          label={state.addType === "photo" ? "Выбрать фотографию" : "Выбрать файл"}
          onSelect={handlePickedFile}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {mainPdfPickerOpen && (
        <FilePicker
          accept=".pdf"
          label="Выбрать основной PDF"
          onSelect={(path) => void handleMainPdfPath(path)}
          onClose={() => setMainPdfPickerOpen(false)}
        />
      )}
    </div>
  );
}
