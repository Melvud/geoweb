import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUiText, updateUiText } from "@/server/portal-repository";
import { defaultUiText } from "@/lib/ui-text";

const COOKIE = "admin_session";

async function isAuthorized() {
  const secret = process.env.ADMIN_SECRET ?? "";
  if (!secret) {
    return false;
  }
  const store = await cookies();
  return store.get(COOKIE)?.value === secret;
}

export async function GET() {
  return NextResponse.json({ uiText: getUiText() });
}

export async function PATCH(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { key?: unknown; value?: unknown };
    const key = typeof body.key === "string" ? body.key : "";
    const value = typeof body.value === "string" ? body.value : "";

    if (!key || !(key in defaultUiText)) {
      return NextResponse.json({ error: "Unknown text key" }, { status: 400 });
    }

    const uiText = updateUiText(key, value);
    return NextResponse.json({ uiText });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update text" },
      { status: 500 },
    );
  }
}
