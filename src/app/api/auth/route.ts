import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { key } = (await req.json()) as { key: string };
  const secret = process.env.ADMIN_SECRET ?? "";
  if (secret && key === secret) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
