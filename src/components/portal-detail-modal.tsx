"use client";

import { Fragment } from "react";
import { accessLabel } from "@/lib/portal-seed";
import { Paperclip } from "lucide-react";
import { parseMarkdown } from "@/lib/portal-utils";
import { useMarkdownEffects } from "@/lib/use-markdown-effects";
import { PdfEmbed } from "@/components/pdf-embed";
import { RequestAccess } from "@/components/request-access";
import type { DetailState } from "@/lib/portal-types";
import { usePortal } from "@/components/portal-provider";

function mainFilePath(detail: DetailState): string | null {
  if (!detail) return null;
  if (detail.kind === "mat") return detail.item.filePath;
  if (detail.kind === "pub") return detail.item.pdfPath;
  if (detail.kind === "archive") return detail.item.filePath;
  if (detail.kind === "library") return detail.item.pdfPath;
  return null;
}

function detailHeading(detail: DetailState) {
  if (!detail) return "";
  if (detail.kind === "mat" || detail.kind === "photo") return detail.item.title;
  if (detail.kind === "pub") return detail.item.title;
  if (detail.kind === "archive") return detail.item.title;
  if (detail.kind === "library") return detail.item.title;
  return detail.item.name;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="field-label" style={{ marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: "var(--forest2)" }}>{value}</div>
    </div>
  );
}

export function PortalDetailModal({
  detail,
  onClose,
}: {
  detail: DetailState;
  onClose: () => void;
}) {
  const { state } = usePortal();
  useMarkdownEffects(detail);

  if (!detail) {
    return null;
  }

  const relatedTopicIds = "relatedTopicIds" in detail.item ? detail.item.relatedTopicIds ?? [] : [];
  const relatedTopicNames = state.topics
    .filter((topic) => relatedTopicIds.includes(topic.id))
    .map((topic) => topic.name)
    .join(", ");

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div className="detail-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="detail-grid">
          <div className="detail-main">
            <div className="section-kicker" style={{ marginBottom: 12 }}>
              {detail.kind === "mat"
                ? "Учебный материал"
                : detail.kind === "pub"
                  ? "Публикация"
                  : detail.kind === "photo"
                    ? "Фотография"
                    : detail.kind === "archive"
                      ? "Архив"
                      : "Научная тема"}
            </div>
            <h2 className="page-title" style={{ fontSize: 38, marginBottom: 18 }}>
              {detailHeading(detail)}
            </h2>
            {detail.kind === "mat" ? (
              <Fragment>
                <div 
                  className="page-copy markdown-body" 
                  style={{ maxWidth: "none", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(detail.item.desc) }}
                />
                <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                  {detail.item.discipline} · {detail.item.course} · {detail.item.year}
                </div>
              </Fragment>
            ) : null}
            {detail.kind === "pub" ? (
              <Fragment>
                <div 
                  className="page-copy markdown-body" 
                  style={{ maxWidth: "none", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(detail.item.summary) }}
                />
                <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                  {detail.item.authors}
                </div>
              </Fragment>
            ) : null}
            {detail.kind === "photo" ? (
              <div
                style={{
                  aspectRatio: "16 / 10",
                  borderRadius: 18,
                  border: "1px solid var(--line)",
                  background: detail.item.imagePath
                    ? `center / cover no-repeat url(${detail.item.imagePath})`
                    : `repeating-linear-gradient(135deg, ${detail.item.tint}, ${detail.item.tint} 14px, rgba(255,255,255,.16) 14px, rgba(255,255,255,.16) 28px)`,
                }}
              />
            ) : null}
            {detail.kind === "topic" ? (
              <div 
                className="page-copy markdown-body" 
                style={{ maxWidth: "none", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}
                dangerouslySetInnerHTML={{ __html: parseMarkdown(detail.item.body || detail.item.desc) }}
              />
            ) : null}
            {detail.kind === "archive" ? (
              <div 
                className="page-copy markdown-body" 
                style={{ maxWidth: "none", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}
                dangerouslySetInnerHTML={{ __html: parseMarkdown(detail.item.desc) }}
              />
            ) : null}

            {/* Доступ «По запросу» — прячем файлы, показываем форму запроса */}
            {(detail.item as any).access === "request" ? (
              <div style={{ marginTop: 8 }}>
                <RequestAccess itemTitle={detailHeading(detail)} compact />
              </div>
            ) : (
              <>
                {/* Основной файл (PDF) — просмотр и скачивание */}
                {mainFilePath(detail) ? (
                  <div style={{ marginTop: 8 }}>
                    <PdfEmbed path={mainFilePath(detail) as string} height={480} />
                  </div>
                ) : null}
              </>
            )}

            {/* Attachments Section */}
            {(detail.item as any).access !== "request" && detail.kind !== "photo" && detail.kind !== "library" && (detail.item as any).attachments && (detail.item as any).attachments.length > 0 && (
              <div style={{ marginTop: 28, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
                <div className="field-label" style={{ marginBottom: 10 }}>Приложения ({(detail.item as any).attachments.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(detail.item as any).attachments.map((file: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "var(--paper2)",
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <Paperclip size={16} strokeWidth={1.8} style={{ flexShrink: 0, color: "var(--muted)" }} />
                        <span 
                          style={{ 
                            fontWeight: 500, 
                            fontSize: 13.5, 
                            color: "var(--ink)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {file.name}
                        </span>
                      </div>
                      <a
                        href={file.path}
                        className="secondary-button"
                        download
                        style={{ textDecoration: "none", padding: "6px 12px", fontSize: 12 }}
                      >
                        Скачать
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <aside className="detail-side">
            <div className="section-kicker" style={{ marginBottom: 16 }}>
              Метаданные
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {detail.kind !== "topic" && relatedTopicNames ? (
                <MetaRow label="Научные темы" value={relatedTopicNames} />
              ) : null}
              {detail.kind === "mat" ? (
                <Fragment>
                  <MetaRow label="Тип" value={detail.item.mtype} />
                  <MetaRow label="Год" value={detail.item.year} />
                  <MetaRow label="Доступ" value={accessLabel(detail.item.access)} />
                  <MetaRow label="Теги" value={detail.item.tags.join(", ")} />
                </Fragment>
              ) : null}
              {detail.kind === "pub" ? (
                <Fragment>
                  <MetaRow label="Тип" value={detail.item.ptype} />
                  <MetaRow label="Журнал" value={detail.item.journal} />
                  <MetaRow label="Регион" value={detail.item.region} />
                  <MetaRow label="Возраст" value={detail.item.age} />
                  <MetaRow label="DOI" value={detail.item.doi} />
                </Fragment>
              ) : null}
              {detail.kind === "photo" ? (
                <Fragment>
                  <MetaRow label="Тип объекта" value={detail.item.otype} />
                  <MetaRow label="Год" value={detail.item.year} />
                  <MetaRow label="Регион" value={detail.item.region} />
                  <MetaRow label="Группа" value={detail.item.group} />
                </Fragment>
              ) : null}
              {detail.kind === "topic" ? (
                <Fragment>
                  <MetaRow label="Регион" value={detail.item.region} />
                  <MetaRow label="Возраст" value={detail.item.age} />
                  <MetaRow label="Публикации" value={String(detail.item.pubs)} />
                  <MetaRow label="Архив" value={String(detail.item.archive)} />
                </Fragment>
              ) : null}
              {detail.kind === "archive" ? (
                <Fragment>
                  <MetaRow label="Тип" value={detail.item.atype} />
                  <MetaRow label="Год" value={detail.item.year} />
                  <MetaRow label="Регион" value={detail.item.region || "—"} />
                  <MetaRow label="Доступ" value={accessLabel(detail.item.access)} />
                </Fragment>
              ) : null}
            </div>
            <button className="primary-button" style={{ marginTop: 24 }} onClick={onClose}>
              Закрыть
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
