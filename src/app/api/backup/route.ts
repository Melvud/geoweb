import fs from "node:fs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Database from "better-sqlite3";
import {
  getDatabase,
  getDatabaseFilePath,
  closeDatabase,
} from "@/server/db";

const COOKIE = "admin_session";

async function isAuthorized() {
  const secret = process.env.ADMIN_SECRET ?? "";
  if (!secret) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === secret;
}

// Экспорт: согласованный снимок всей базы одним файлом
export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buffer = getDatabase().serialize();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="geoweb-backup-${stamp}.db"`,
    },
  });
}

// Восстановление: заменяет текущую БД загруженным файлом (с предварительной валидацией и авто-бэкапом)
export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Валидация: файл должен быть корректной БД портала
    try {
      const test = new Database(buffer);
      test.prepare("SELECT COUNT(*) FROM materials").get();
      test.close();
    } catch {
      return NextResponse.json(
        { error: "Файл не является корректной резервной копией портала" },
        { status: 400 },
      );
    }

    const dbPath = getDatabaseFilePath();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    // Закрываем текущее соединение, чтобы освободить файл
    closeDatabase();

    // Авто-бэкап перед заменой
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, `${dbPath}.pre-restore-${stamp}`);
    }
    // Чистим WAL/SHM, иначе старые данные могут «перетереть» восстановленные
    for (const suffix of ["-wal", "-shm"]) {
      const sidecar = `${dbPath}${suffix}`;
      if (fs.existsSync(sidecar)) fs.rmSync(sidecar);
    }

    fs.writeFileSync(dbPath, buffer);

    // Прогреваем новое соединение
    getDatabase();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось восстановить базу" },
      { status: 500 },
    );
  }
}
