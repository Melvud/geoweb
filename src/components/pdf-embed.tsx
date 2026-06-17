"use client";

import { useState } from "react";
import { FileText, Download, ChevronDown, ChevronUp } from "lucide-react";

// Просмотр PDF прямо на странице (нативный просмотрщик браузера в iframe).
export function PdfEmbed({ path, height = 600 }: { path: string; height?: number }) {
  const [open, setOpen] = useState(false);
  const isPdf = /\.pdf($|\?)/i.test(path);
  if (!path || !isPdf) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          className="secondary-button"
          onClick={() => setOpen((v) => !v)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <FileText size={14} strokeWidth={2} />
          {open ? "Свернуть просмотр" : "Просмотреть PDF"}
          {open ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
        </button>
        <a
          href={path}
          download
          className="secondary-button"
          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Download size={14} strokeWidth={2} /> Скачать
        </a>
      </div>

      {open && (
        <div style={{ marginTop: 14, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
          <iframe
            src={path}
            title="PDF"
            style={{ width: "100%", height, border: "none", display: "block", background: "var(--paper2)" }}
          />
        </div>
      )}
    </div>
  );
}
