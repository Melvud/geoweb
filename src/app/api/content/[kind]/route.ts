import { NextResponse } from "next/server";
import {
  createArchiveItem,
  createLibraryItem,
  createMapPlace,
  createMaterial,
  createPhoto,
  createPublication,
  createTopic,
} from "@/server/portal-repository";

type Params = {
  params: Promise<{ kind: string }>;
};

export async function POST(request: Request, context: Params) {
  const { kind } = await context.params;
  const body = await request.json();

  try {
    switch (kind) {
      case "materials":
        return NextResponse.json({ item: createMaterial(body) });
      case "publications":
        return NextResponse.json({ item: createPublication(body) });
      case "photos":
        return NextResponse.json({ item: createPhoto(body) });
      case "topics":
        return NextResponse.json({ item: createTopic(body) });
      case "archive":
        return NextResponse.json({ item: createArchiveItem(body) });
      case "library":
        return NextResponse.json({ item: createLibraryItem(body) });
      case "places":
        return NextResponse.json({ item: createMapPlace(body) });
      default:
        return NextResponse.json({ error: "Unknown content kind" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create record" },
      { status: 500 },
    );
  }
}
