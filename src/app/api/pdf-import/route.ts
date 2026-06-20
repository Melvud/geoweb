import { createHash } from "node:crypto";
import { access, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function pythonCandidates() {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  return [
    process.env.PDF_IMPORT_PYTHON,
    home ? path.join(home, ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe") : "",
    "python",
    "python3",
  ].filter(Boolean) as string[];
}

async function findPython() {
  for (const candidate of pythonCandidates()) {
    if (candidate.includes(path.sep)) {
      try {
        await access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }
    return candidate;
  }
  throw new Error("Python runtime not found");
}

function runExtractor(python: string, script: string, input: string, output: string, publicPrefix: string) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(python, [script, input, output, publicPrefix], { windowsHide: true });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("PDF processing timed out"));
    }, 120_000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || `PDF extractor exited with code ${code}`));
    });
  });
}

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SECRET ?? "";
  const session = (await cookies()).get("admin_session")?.value;
  if (!secret || session !== secret) {
    return NextResponse.json({ error: "Требуется доступ администратора" }, { status: 401 });
  }

  try {
    const { path: webPath } = await request.json() as { path?: string };
    if (!webPath || !/^\/uploads\/[a-zA-Z0-9_./-]+\.pdf$/i.test(webPath)) {
      return NextResponse.json({ error: "Укажите загруженный PDF" }, { status: 400 });
    }

    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
    const inputPath = path.resolve(process.cwd(), "public", webPath.replace(/^\//, ""));
    if (!inputPath.startsWith(`${uploadsRoot}${path.sep}`)) {
      return NextResponse.json({ error: "Недопустимый путь к PDF" }, { status: 400 });
    }
    const file = await stat(inputPath);
    if (file.size > 80 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF больше 80 МБ; обработайте его частями" }, { status: 413 });
    }

    const id = createHash("sha256").update(`${inputPath}:${file.size}:${file.mtimeMs}`).digest("hex").slice(0, 16);
    const outputDir = path.join(uploadsRoot, "pdf-import", id);
    const publicPrefix = `/uploads/pdf-import/${id}`;
    await mkdir(outputDir, { recursive: true });
    const python = await findPython();
    const script = path.join(process.cwd(), "scripts", "extract_pdf.py");
    const output = await runExtractor(python, script, inputPath, outputDir, publicPrefix);
    return NextResponse.json(JSON.parse(output));
  } catch (error) {
    console.error("PDF import failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? `Не удалось разобрать PDF: ${error.message}` : "Не удалось разобрать PDF" },
      { status: 500 },
    );
  }
}
