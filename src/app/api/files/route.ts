import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getPortalSnapshot } from "@/server/portal-repository";

export type FileEntry = {
  name: string;
  path: string;       // web path: /uploads/folder/foo.pdf or /uploads/foo.pdf
  folder: string;     // "" for root, "photos" for /uploads/photos/
  size: number;       // bytes
  mtime: number;      // unix ms
  ext: string;
  referenced: boolean;
};

function collectReferencedPaths(): Set<string> {
  const snap = getPortalSnapshot();
  const paths = new Set<string>();

  // Надёжно: сериализуем весь снапшот и достаём ВСЕ пути /uploads/...
  // Покрывает структурные поля (обложки, превью, вложения), изображения/видео
  // внутри Markdown-текстов (desc/summary/body), обложки мест карты,
  // фото страниц «Главная»/«Обо мне» и т. д.
  const serialized = JSON.stringify(snap);
  const matches = serialized.match(/\/uploads\/[^"')\s\]<>]+/g);
  if (matches) {
    for (const raw of matches) {
      paths.add(raw.replace(/[.,;]+$/, ""));
    }
  }

  return paths;
}

function scanDir(dir: string, uploadsRoot: string, referenced: Set<string>, files: FileEntry[]) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanDir(full, uploadsRoot, referenced, files);
    } else {
      const rel = path.relative(uploadsRoot, full).replace(/\\/g, "/");
      const folder = rel.includes("/") ? rel.split("/").slice(0, -1).join("/") : "";
      const webPath = `/uploads/${rel}`;
      files.push({
        name: entry,
        path: webPath,
        folder,
        size: stat.size,
        mtime: stat.mtimeMs,
        ext: path.extname(entry).toLowerCase().replace(".", ""),
        referenced: referenced.has(webPath),
      });
    }
  }
}

export async function GET() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const referenced = collectReferencedPaths();
  const files: FileEntry[] = [];

  scanDir(uploadsDir, uploadsDir, referenced, files);
  files.sort((a, b) => b.mtime - a.mtime);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const folders = Array.from(new Set(files.map((f) => f.folder).filter(Boolean))).sort();

  return NextResponse.json({ files, totalSize, folders });
}

export async function DELETE(req: Request) {
  const body = await req.json() as { path?: string; name?: string };
  // Accept either `path` (/uploads/folder/file.pdf) or legacy `name` (file.pdf at root)
  const raw = body.path ?? (body.name ? `/uploads/${body.name}` : "");
  const webPath = raw.startsWith("/") ? raw : `/${raw}`;

  if (!webPath || !webPath.startsWith("/uploads/") || webPath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const full = path.join(process.cwd(), "public", webPath);

  if (!fs.existsSync(full)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  fs.unlinkSync(full);
  return NextResponse.json({ ok: true });
}
