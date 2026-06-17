import { NextResponse } from "next/server";
import { recordPageView } from "@/server/portal-repository";

// Публичный эндпоинт трекинга просмотров (без cookie, без IP, без внешних сервисов)
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { path?: unknown };
    const path = typeof body.path === "string" ? body.path : "";

    // Считаем только публичные страницы, без админки и служебных путей
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.json({ ok: false });
    }

    recordPageView(path.slice(0, 200));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
