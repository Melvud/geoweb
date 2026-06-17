"use client";

import { useEffect, useState } from "react";
import { Folder, X } from "lucide-react";

const PRESET_FOLDERS = ["photos", "lectures", "publications", "archive", "library", "documents"];

// Глобальный диалог: «В какую папку сохранить файл(ы)?»
export function FolderPromptDialog({
  open,
  onResolve,
}: {
  open: boolean;
  onResolve: (folder: string | null) => void;
}) {
  const [folder, setFolder] = useState("");
  const [custom, setCustom] = useState("");
  const [folders, setFolders] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setFolder("");
    setCustom("");
    fetch("/api/files", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setFolders(j.folders ?? []))
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const effective = folder === "__custom__" ? custom.trim() : folder;
  const allFolders = Array.from(new Set([...PRESET_FOLDERS, ...folders])).sort();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onResolve(null);
      }}
    >
      <div
        className="panel"
        style={{ width: "min(460px, 95vw)", padding: 0, overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <Folder size={16} strokeWidth={1.9} style={{ color: "var(--clay)" }} />
            В какую папку сохранить?
          </div>
          <button className="icon-button" onClick={() => onResolve(null)} title="Отмена">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
            Выберите папку для хранения. Если выбрано несколько файлов — все сохранятся в неё.
          </p>
          <div>
            <div className="field-label">Папка</div>
            <select className="select-input" value={folder} onChange={(e) => setFolder(e.target.value)}>
              <option value="">— корень (uploads/)</option>
              {allFolders.map((f) => (
                <option key={f} value={f}>{f}/</option>
              ))}
              <option value="__custom__">+ Новая папка...</option>
            </select>
            {folder === "__custom__" && (
              <input
                className="text-input"
                style={{ marginTop: 8 }}
                placeholder="Название папки (латиницей, напр.: geology-2024)"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                autoFocus
              />
            )}
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
              Путь: /uploads/{effective ? `${effective}/` : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="primary-button" onClick={() => onResolve(effective)}>
              Сохранить сюда
            </button>
            <button className="secondary-button" onClick={() => onResolve(null)}>
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
