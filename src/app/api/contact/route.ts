import { NextResponse } from "next/server";
import { createMessage } from "@/server/portal-repository";

// Публичный приём сообщений из формы обратной связи.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      email?: unknown;
      body?: unknown;
      website?: unknown; // honeypot
    };

    // Honeypot: боты заполняют скрытое поле — молча игнорируем
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const text = typeof body.body === "string" ? body.body.trim() : "";

    if (!name || !text) {
      return NextResponse.json({ error: "Укажите имя и сообщение" }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json({ error: "Слишком длинное сообщение" }, { status: 400 });
    }

    createMessage({ name, email, body: text });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось отправить" },
      { status: 500 },
    );
  }
}
