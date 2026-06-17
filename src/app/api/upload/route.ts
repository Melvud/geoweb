import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

function sanitizeSegment(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const rawFolder = url.searchParams.get("folder") ?? "";
    const folder = rawFolder ? sanitizeSegment(rawFolder) : "";

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = path.extname(file.name);
    const baseName = path.basename(file.name, extension);
    const fileName = `${Date.now()}-${randomUUID().slice(0, 6)}-${sanitizeSegment(baseName)}${extension}`;

    const relativePath = folder
      ? `/uploads/${folder}/${fileName}`
      : `/uploads/${fileName}`;

    const outputPath = path.join(process.cwd(), "public", folder ? `uploads/${folder}` : "uploads", fileName);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, bytes);

    return NextResponse.json({ path: relativePath, name: file.name, size: file.size });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 },
    );
  }
}
