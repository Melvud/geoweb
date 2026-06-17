import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteMessage, markMessageRead } from "@/server/portal-repository";

const COOKIE = "admin_session";

async function isAuthorized() {
  const secret = process.env.ADMIN_SECRET ?? "";
  if (!secret) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === secret;
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Params) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await request.json()) as { isRead?: boolean };
  markMessageRead(id, Boolean(body.isRead));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: Params) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  deleteMessage(id);
  return NextResponse.json({ ok: true });
}
