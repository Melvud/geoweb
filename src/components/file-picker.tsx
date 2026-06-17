"use client";

import { useEffect, useRef, useState } from "react";
import type { FileEntry } from "@/app/api/files/route";
import { X, Upload, Folder, Search } from "lucide-react";
import { FileIcon } from "@/components/ui-icons";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

const PRESET_FOLDERS = ["photos", "lectures", "publications", "archive", "library", "documents"];

export type FilePickerProps = {
  accept?: string;
  onSelect: (webPath: string) => void;
  onClose: () => void;
  label?: string;
};

export function FilePicker({ accept, onSelect, onClose, label }: FilePickerProps) {
  const [tab, setTab] = useState<"upload" | "library">("upload");
  const [folder, setFolder] = useState("");
  const [customFolder, setCustomFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libFolder, setLibFolder] = useState("");
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadLibrary() {
    setLibLoading(true);
    const res = await fetch("/api/files", { cache: "no-store" });
    const json = await res.json();
    setFiles(json.files ?? []);
    setFolders(json.folders ?? []);
    setLibLoading(false);
  }

  useEffect(() => {
    if (tab === "library") loadLibrary();
  }, [tab]);

  const effectiveFolder = folder === "__custom__" ? customFolder.trim() : folder;

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const url = effectiveFolder ? `/api/upload?folder=${encodeURIComponent(effectiveFolder)}` : "/api/upload";
    const res = await fetch(url, { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (json.path) {
      onSelect(json.path);
      onClose();
    }
  }

  const allFolders = Array.from(new Set([...PRESET_FOLDERS, ...folders])).sort();

  const visibleFiles = files.filter((f) => {
    if (libFolder && f.folder !== libFolder) return false;
    if (query && !f.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.45)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="panel"
        style={{
          width: "min(680px, 95vw)", maxHeight: "80vh",
          display: "flex", flexDirection: "column",
          padding: 0, overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{label ?? "Выбрать файл"}</div>
          <button className="icon-button" onClick={onClose} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={18} strokeWidth={2} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--line)", background: "var(--paper2)" }}>
          {(["upload", "library"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "11px 0", fontSize: 13, fontWeight: tab === t ? 700 : 400,
                background: "none", border: "none", cursor: "pointer",
                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === t ? "var(--accent)" : "var(--muted)",
                transition: "color 0.15s",
              }}
            >
              {t === "upload" ? <><Upload size={13} strokeWidth={2} style={{ marginRight: 5 }} />Загрузить новый</> : <><Folder size={13} strokeWidth={1.8} style={{ marginRight: 5 }} />Из загруженных</>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {tab === "upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Folder selector */}
              <div>
                <div className="field-label">Папка для сохранения</div>
                <select
                  className="select-input"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                >
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
                    placeholder="Название папки (латиницей, например: geology-2024)"
                    value={customFolder}
                    onChange={(e) => setCustomFolder(e.target.value)}
                  />
                )}
                {effectiveFolder && (
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    Файл будет сохранён в: /uploads/{effectiveFolder}/
                  </div>
                )}
              </div>

              {/* File input */}
              <div>
                <div className="field-label">Файл</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept={accept}
                  className="text-input"
                  style={{ padding: "8px 12px", cursor: "pointer" }}
                  onChange={() => {}}
                />
              </div>

              <button
                className="primary-button"
                onClick={handleUpload}
                disabled={uploading}
                style={{ alignSelf: "flex-start" }}
              >
                {uploading ? "Загрузка..." : "Загрузить и выбрать"}
              </button>
            </div>
          )}

          {tab === "library" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Filters */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div className="search-wrap-wide" style={{ flex: 1, minWidth: 180 }}>
                  <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
                  <input
                    className="text-input"
                    style={{ paddingLeft: 34 }}
                    placeholder="Поиск по имени..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <select
                  className="select-input"
                  style={{ minWidth: 140 }}
                  value={libFolder}
                  onChange={(e) => setLibFolder(e.target.value)}
                >
                  <option value="">Все папки</option>
                  {folders.map((f) => (
                    <option key={f} value={f}>{f}/</option>
                  ))}
                </select>
              </div>

              {libLoading ? (
                <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Загрузка...</div>
              ) : visibleFiles.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                  {files.length === 0 ? "Нет загруженных файлов" : "Ничего не найдено"}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {visibleFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => { onSelect(file.path); onClose(); }}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "28px 1fr auto auto",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        background: "var(--paper2)",
                        border: "1px solid var(--line2)",
                        borderRadius: 6,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--paper2)")}
                    >
                      <span style={{ color: "var(--muted)", display: "flex", alignItems: "center" }}><FileIcon ext={file.ext} size={16} /></span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, wordBreak: "break-all" }}>{file.name}</div>
                        {file.folder && (
                          <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{file.folder}/</div>
                        )}
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {fmtSize(file.size)}
                      </div>
                      <div
                        style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 4,
                          background: "var(--accent)", color: "#fff", whiteSpace: "nowrap",
                        }}
                      >
                        Выбрать
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
