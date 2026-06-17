"use client";

import { useEffect, useState } from "react";
import type { FileEntry } from "@/app/api/files/route";
import { Search, Trash2, RefreshCw, Folder } from "lucide-react";
import { FileIcon } from "@/components/ui-icons";

type FilesResponse = { files: FileEntry[]; totalSize: number; folders: string[] };

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type SortKey = "mtime" | "name" | "size";

export function AdminFilesView() {
  const [data, setData] = useState<FilesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "orphaned">("all");
  const [folderFilter, setFolderFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("mtime");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/files", { cache: "no-store" });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(file: FileEntry) {
    if (!confirm(`Удалить файл «${file.name}»?\nЭто действие необратимо.`)) return;
    setDeleting(file.path);
    await fetch("/api/files", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: file.path }),
    });
    setDeleting(null);
    load();
  }

  async function deleteAllOrphaned() {
    const orphans = visibleFiles.filter((f) => !f.referenced);
    if (!orphans.length) return;
    if (!confirm(`Удалить ${orphans.length} неиспользуемых файлов? Действие необратимо.`)) return;
    for (const f of orphans) {
      await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: f.path }),
      });
    }
    load();
  }

  function toggleSort(key: SortKey) {
    if (sortBy === key) setSortDir((d) => (d === -1 ? 1 : -1));
    else { setSortBy(key); setSortDir(-1); }
  }

  const files = data?.files ?? [];

  const visibleFiles = files
    .filter((f) => {
      if (filter === "orphaned" && f.referenced) return false;
      if (folderFilter && f.folder !== folderFilter) return false;
      if (query && !f.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const va = sortBy === "name" ? a.name : sortBy === "size" ? a.size : a.mtime;
      const vb = sortBy === "name" ? b.name : sortBy === "size" ? b.size : b.mtime;
      return typeof va === "string"
        ? va.localeCompare(vb as string) * sortDir
        : ((va as number) - (vb as number)) * sortDir;
    });

  // Группировка по папкам (корень первым, затем по алфавиту)
  const fileGroups: Array<[string, FileEntry[]]> = (() => {
    const map = new Map<string, FileEntry[]>();
    for (const f of visibleFiles) {
      const key = f.folder || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "") return -1;
      if (b[0] === "") return 1;
      return a[0].localeCompare(b[0]);
    });
  })();

  const orphanCount = files.filter((f) => !f.referenced).length;
  const orphanSize = files.filter((f) => !f.referenced).reduce((s, f) => s + f.size, 0);

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontWeight: sortBy === k ? 700 : 400,
        fontSize: 11, color: "var(--muted)", padding: 0,
        display: "flex", alignItems: "center", gap: 3,
      }}
    >
      {label} {sortBy === k ? (sortDir === -1 ? "↓" : "↑") : ""}
    </button>
  );

  return (
    <div className="route">
      <div className="dashboard-top" style={{ alignItems: "center" }}>
        <div>
          <div className="section-kicker">Сервер</div>
          <h1 className="page-title" style={{ margin: 0 }}>Файловый менеджер</h1>
        </div>
        <button className="secondary-button" onClick={load} disabled={loading}>
          {loading ? "Загрузка..." : <><RefreshCw size={13} strokeWidth={2} style={{ marginRight: 5 }} />Обновить</>}
        </button>
      </div>

      {/* Stats */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Всего файлов", value: String(files.length) },
            { label: "Занято места", value: fmtSize(data.totalSize) },
            { label: "Неиспользуемых", value: `${orphanCount} (${fmtSize(orphanSize)})`, warn: orphanCount > 0 },
          ].map(({ label, value, warn }) => (
            <div
              key={label}
              className="panel"
              style={{ padding: "14px 18px", background: warn ? "var(--sand)" : undefined }}
            >
              <div className="field-label" style={{ marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: warn ? "var(--clay)" : "var(--ink)" }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div className="search-wrap-wide" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
          <input
            className="text-input"
            style={{ paddingLeft: 34 }}
            placeholder="Поиск по имени файла..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {(data?.folders?.length ?? 0) > 0 && (
          <select
            className="select-input"
            style={{ minWidth: 140 }}
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
          >
            <option value="">Все папки</option>
            {(data?.folders ?? []).map((f) => (
              <option key={f} value={f}>{f}/</option>
            ))}
          </select>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "orphaned"] as const).map((f) => (
            <button
              key={f}
              className={filter === f ? "primary-button" : "secondary-button"}
              style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Все файлы" : `Неиспользуемые (${orphanCount})`}
            </button>
          ))}
        </div>
        {orphanCount > 0 && (
          <button
            className="secondary-button"
            style={{ fontSize: 12, padding: "6px 14px", color: "var(--clay)", borderColor: "var(--clay)" }}
            onClick={deleteAllOrphaned}
          >
            <Trash2 size={13} strokeWidth={1.8} style={{ marginRight: 5 }} /> Очистить неиспользуемые
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="panel" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          Загрузка файлов...
        </div>
      ) : visibleFiles.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          {files.length === 0 ? "Нет загруженных файлов" : "Ничего не найдено"}
        </div>
      ) : (
        <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr 80px 90px 90px 80px",
              gap: 8,
              padding: "10px 16px",
              borderBottom: "1px solid var(--line)",
              background: "var(--paper2)",
            }}
          >
            <div />
            <SortBtn k="name" label="Имя файла" />
            <SortBtn k="size" label="Размер" />
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>Тип</div>
            <SortBtn k="mtime" label="Дата" />
            <div />
          </div>

          {fileGroups.map(([groupFolder, groupFiles]) => (
            <div key={groupFolder || "__root__"}>
              {/* Заголовок папки */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 16px",
                  background: "var(--sand)",
                  borderBottom: "1px solid var(--line2)",
                  borderTop: "1px solid var(--line2)",
                }}
              >
                <Folder size={14} strokeWidth={1.9} style={{ color: "var(--clay)" }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {groupFolder ? `${groupFolder}/` : "Корень (uploads/)"}
                </span>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                  {groupFiles.length} · {fmtSize(groupFiles.reduce((s, f) => s + f.size, 0))}
                </span>
              </div>

              {groupFiles.map((file) => (
            <div
              key={file.path}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 80px 90px 90px 80px",
                gap: 8,
                alignItems: "center",
                padding: "10px 16px 10px 28px",
                borderBottom: "1px solid var(--line2)",
                background: !file.referenced ? "rgba(180,80,40,0.04)" : undefined,
              }}
            >
              {/* Icon */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                <FileIcon ext={file.ext} size={16} />
              </div>

              {/* Name + badge */}
              <div style={{ minWidth: 0 }}>
                <a
                  href={file.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 13, fontWeight: 500, color: "var(--ink)",
                    textDecoration: "none", wordBreak: "break-all",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  {file.name}
                </a>
                {!file.referenced && (
                  <span
                    className="mono"
                    style={{
                      marginLeft: 8, fontSize: 9, background: "var(--clay)",
                      color: "#fff", borderRadius: 3, padding: "1px 5px",
                    }}
                  >
                    не используется
                  </span>
                )}
              </div>

              {/* Size */}
              <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                {fmtSize(file.size)}
              </div>

              {/* Ext */}
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>
                {file.ext || "—"}
              </div>

              {/* Date */}
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                {fmtDate(file.mtime)}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <a
                  href={file.path}
                  download
                  className="icon-button"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                  title="Скачать"
                >
                  ↓
                </a>
                <button
                  className="icon-button"
                  disabled={deleting === file.path}
                  onClick={() => handleDelete(file)}
                  title="Удалить"
                  style={{ color: "var(--clay)" }}
                >
                  {deleting === file.path ? "…" : <Trash2 size={13} strokeWidth={1.8} />}
                </button>
              </div>
            </div>
              ))}
            </div>
          ))}
        </section>
      )}

      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>
        {visibleFiles.length} из {files.length} файлов · {fmtSize(visibleFiles.reduce((s, f) => s + f.size, 0))}
      </div>
    </div>
  );
}
