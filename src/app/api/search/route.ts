import { NextResponse } from "next/server";
import { searchPortal } from "@/server/portal-repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  return NextResponse.json({ results: searchPortal(q) });
}
