import { NextResponse } from "next/server";
import { getPortalSnapshot } from "@/server/portal-repository";

export async function GET() {
  return NextResponse.json(getPortalSnapshot());
}
