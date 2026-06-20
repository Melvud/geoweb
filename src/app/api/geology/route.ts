import { NextRequest, NextResponse } from "next/server";
import type { GeologyInfo } from "@/lib/geology";

type MacrostratUnit = {
  source_id?: number;
  name?: string;
  lith?: string;
  descrip?: string;
  comments?: string;
  best_int_name?: string;
  t_int_name?: string;
  b_int_name?: string;
  t_age?: number;
  b_age?: number;
  t_int_age?: number;
  b_int_age?: number;
  color?: string;
};

type MacrostratResponse = {
  success?: {
    data?: MacrostratUnit[];
    refs?: Record<string, string>;
  };
};

export async function GET(request: NextRequest) {
  const latParam = request.nextUrl.searchParams.get("lat");
  const lngParam = request.nextUrl.searchParams.get("lng");
  const lat = Number(latParam);
  const lng = Number(lngParam);

  if (latParam === null || lngParam === null || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Некорректные координаты" }, { status: 400 });
  }

  const endpoint = new URL("https://macrostrat.org/api/v2/geologic_units/map");
  endpoint.searchParams.set("lat", lat.toFixed(6));
  endpoint.searchParams.set("lng", lng.toFixed(6));

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Macrostrat returned ${response.status}`);

    const payload = (await response.json()) as MacrostratResponse;
    const unit = payload.success?.data?.[0];
    if (!unit) return NextResponse.json({ geology: null });

    const sourceId = typeof unit.source_id === "number" ? unit.source_id : null;
    const ageYoungMa = unit.t_age ?? unit.t_int_age ?? null;
    const ageOldMa = unit.b_age ?? unit.b_int_age ?? null;
    const geology: GeologyInfo = {
      lat,
      lng,
      name: unit.name || "Геологическая единица",
      lithology: unit.lith || "",
      description: unit.descrip || unit.comments || "",
      ageName: unit.best_int_name || unit.t_int_name || unit.b_int_name || "",
      ageYoungMa,
      ageOldMa,
      color: unit.color || "#c8b98a",
      source: sourceId === null ? "" : payload.success?.refs?.[String(sourceId)] || "",
      sourceId,
    };

    return NextResponse.json({ geology }, {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("Macrostrat geology lookup failed", error);
    return NextResponse.json({ error: "Геологические данные временно недоступны" }, { status: 502 });
  }
}
