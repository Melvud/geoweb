"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { usePortal } from "@/components/portal-provider";

export function AdminBackupCard() {
  const { refreshData } = usePortal();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function restore(file: File) {
    if (
      !window.confirm(
        "Восстановление заменит ВСЕ текущие данные портала содержимым файла. " +
          "Текущая база будет автоматически сохранена рядом. Продолжить?",
      )
    ) {
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/backup", { method: "POST", body: formData });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Ошибка восстановления");
      }
      await refreshData();
      setStatus("База восстановлена ✓");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось восстановить");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="panel template-list">
      <h3 className="panel-title" style={{ marginBottom: 6 }}>
        Резервная копия
      </h3>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
        Скачайте полную копию базы данных (материалы, публикации, фото, тексты сайта)
        или восстановите её из файла.
      </p>

      <a
        href="/api/backup"
        download
        className="template-button"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Download size={15} strokeWidth={1.9} style={{ color: "var(--clay)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>Скачать резервную копию</span>
      </a>

      <button
        className="template-button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        style={{ width: "100%" }}
      >
        <Upload size={15} strokeWidth={1.9} style={{ color: "var(--clay)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: "left" }}>
          {busy ? "Восстановление..." : "Восстановить из файла"}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".db,.sqlite,application/octet-stream"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void restore(file);
        }}
      />

      {status && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--forest2)" }}>{status}</div>
      )}
    </section>
  );
}
