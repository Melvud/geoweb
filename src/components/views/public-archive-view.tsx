"use client";

import { usePortal } from "@/components/portal-provider";
import { EditableText } from "@/components/editable-text";
import { isListedPublic } from "@/lib/portal-utils";

export function PublicArchiveView() {
  const { state, openDetail } = usePortal();
  const archiveItems = state.archiveItems.filter((item) => isListedPublic(item.access));

  return (
    <section className="public-section narrow">
      <EditableText as="div" id="archive.kicker" className="section-kicker" style={{ marginBottom: 14 }} />
      <EditableText as="h1" id="archive.title" className="page-title" style={{ marginBottom: 14 }} />
      <EditableText as="p" id="archive.subtitle" className="page-copy" multiline style={{ margin: "0 0 30px", maxWidth: 600 }} />
      <div className="archive-table">
        {archiveItems.map((item) => (
          <div 
            key={item.id} 
            className="archive-row clickable" 
            onClick={() => openDetail({ kind: "archive", item })}
          >
            <div className="panel-title" style={{ fontSize: 17, lineHeight: 1.25 }}>
              {item.title}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              {item.atype}
            </div>
            <div className="mono" style={{ fontSize: 12 }}>{item.year}</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: item.dot,
                }}
              />
              <span className="mono" style={{ fontSize: 10.5, color: "var(--forest2)" }}>
                {item.access}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
