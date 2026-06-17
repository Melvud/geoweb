import { NextResponse } from "next/server";
import {
  deleteArchiveItem,
  deleteLibraryItem,
  deleteMapPlace,
  deleteMaterial,
  deletePhoto,
  deletePublication,
  deleteTopic,
  updateArchiveItem,
  updateLibraryItem,
  updateMapPlace,
  updateMaterial,
  updatePhoto,
  updatePublication,
  updateTopic,
} from "@/server/portal-repository";

type Params = {
  params: Promise<{ kind: string; id: string }>;
};

export async function PATCH(request: Request, context: Params) {
  const { kind, id } = await context.params;
  const body = await request.json();

  try {
    let item = null;
    switch (kind) {
      case "materials":
        item = updateMaterial(id, body);
        break;
      case "publications":
        item = updatePublication(id, body);
        break;
      case "photos":
        item = updatePhoto(id, body);
        break;
      case "topics":
        item = updateTopic(id, body);
        break;
      case "archive":
        item = updateArchiveItem(id, body);
        break;
      case "library":
        item = updateLibraryItem(id, body);
        break;
      case "places":
        item = updateMapPlace(id, body);
        break;
      default:
        return NextResponse.json({ error: "Unknown content kind" }, { status: 404 });
    }

    if (!item) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update record" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Params) {
  const { kind, id } = await context.params;

  try {
    switch (kind) {
      case "materials":
        deleteMaterial(id);
        break;
      case "publications":
        deletePublication(id);
        break;
      case "photos":
        deletePhoto(id);
        break;
      case "topics":
        deleteTopic(id);
        break;
      case "archive":
        deleteArchiveItem(id);
        break;
      case "library":
        deleteLibraryItem(id);
        break;
      case "places":
        deleteMapPlace(id);
        break;
      default:
        return NextResponse.json({ error: "Unknown content kind" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete record" },
      { status: 500 },
    );
  }
}
