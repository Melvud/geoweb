"use client";

import { Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePortal } from "@/components/portal-provider";
import { ArrowRight, ArrowLeft, Download } from "lucide-react";
import { disciplines, accessLabel } from "@/lib/portal-seed";
import { isOpenMaterial, splitByGroup, typeShort, typeTint } from "@/lib/portal-utils";
import { EditableText } from "@/components/editable-text";

export function PublicStudentsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, openDetail } = usePortal();

  const selectedDiscipline = searchParams.get("discipline");
  const publicMaterials = state.materials.filter(isOpenMaterial);

  const homeDisciplines = disciplines
    .map((name) => ({
      name,
      count: publicMaterials.filter((item) => item.discipline === name).length,
    }))
    .filter((item) => item.count > 0);

  const studentGroups = splitByGroup(publicMaterials, selectedDiscipline);

  function go(href: string) {
    router.push(href);
  }

  return (
    <section className="public-section">
      {!selectedDiscipline ? (
        <Fragment>
          <EditableText
            as="div"
            id="students.kicker"
            className="section-kicker"
            style={{ marginBottom: 14 }}
          />
          <EditableText
            as="h1"
            id="students.title"
            className="page-title"
            style={{ marginBottom: 12 }}
          />
          <EditableText
            as="p"
            id="students.subtitle"
            className="page-copy"
            multiline
            style={{ margin: "0 0 36px", maxWidth: 560 }}
          />
          <div className="disc-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))" }}>
            {homeDisciplines.map((item) => (
              <button
                key={item.name}
                className="topic-card"
                onClick={() =>
                  go(`/students?discipline=${encodeURIComponent(item.name)}`)
                }
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <span className="mono" style={{ fontSize: 11, color: "var(--clay)" }}>
                    {item.count} материалов
                  </span>
                  <ArrowRight size={18} strokeWidth={2} style={{ color: "var(--clay)", flexShrink: 0 }} />
                </div>
                <div className="panel-title" style={{ fontSize: 24, lineHeight: 1.18 }}>
                  {item.name}
                </div>
              </button>
            ))}
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <button className="panel-link" onClick={() => !state.editMode && go("/students")}>
            <ArrowLeft size={14} strokeWidth={2} style={{ marginRight: 4 }} />{" "}
            <EditableText id="students.backLink" />
          </button>
          <h1 className="page-title" style={{ marginTop: 18, marginBottom: 6 }}>
            {selectedDiscipline}
          </h1>
          <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 34 }}>
            {publicMaterials.filter((item) => item.discipline === selectedDiscipline).length} материалов
          </div>
          {studentGroups.map((group) => (
            <div key={group.type} style={{ marginBottom: 34 }}>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--forest2)",
                  borderBottom: "1px solid var(--line)",
                  paddingBottom: 9,
                  marginBottom: 16,
                }}
              >
                {group.type}
              </div>
              <div className="disc-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {group.items.map((item) => {
                  const tint = typeTint(item.mtype);
                  return (
                    <button
                      key={item.id}
                      className="item-card"
                      style={{ height: "100%", cursor: "pointer" }}
                      onClick={() => openDetail({ kind: "mat", item })}
                    >
                      {/* Обложка — фото или плашка с чипом */}
                      {item.previewPath ? (
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "16 / 9",
                            flexShrink: 0,
                            backgroundImage: `url(${item.previewPath})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            position: "relative",
                          }}
                        >
                          <span
                            className="type-chip"
                            style={{
                              background: tint[0],
                              color: tint[1],
                              position: "absolute",
                              bottom: 10,
                              left: 12,
                            }}
                          >
                            {typeShort(item.mtype)}
                          </span>
                          <span
                            className="mono"
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.85)",
                              position: "absolute",
                              bottom: 12,
                              right: 12,
                              textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                            }}
                          >
                            {item.year}
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "16px 18px 0",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span className="type-chip" style={{ background: tint[0], color: tint[1] }}>
                            {typeShort(item.mtype)}
                          </span>
                          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                            {item.year}
                          </span>
                        </div>
                      )}

                      {/* Текстовое тело — занимает оставшееся место */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          padding: "12px 18px 16px",
                        }}
                      >
                        <h3
                          className="panel-title clamp-2"
                          style={{ fontSize: 17, lineHeight: 1.3, marginBottom: 8 }}
                        >
                          {item.title}
                        </h3>
                        <p
                          className="clamp-3"
                          style={{
                            flex: 1,
                            fontSize: 13,
                            lineHeight: 1.5,
                            color: "var(--forest2)",
                            margin: 0,
                          }}
                        >
                          {item.desc}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderTop: "1px solid var(--line2)",
                            paddingTop: 11,
                            marginTop: 12,
                          }}
                        >
                          <span className="mono" style={{ fontSize: 11, color: "var(--clay)" }}>
                            <Download size={11} strokeWidth={2} style={{ marginRight: 3 }} /> Скачать
                          </span>
                          <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                            {accessLabel(item.access)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </Fragment>
      )}
    </section>
  );
}
