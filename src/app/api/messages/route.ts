import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMessages } from "@/server/portal-repository";

const COOKIE = "admin_session";

async function isAuthorized() {
  const secret = process.env.ADMIN_SECRET ?? "";
  if (!secret) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === secret;
}

export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ messages: getMessages() });
}
