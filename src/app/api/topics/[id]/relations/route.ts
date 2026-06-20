import { NextResponse } from "next/server";
import { syncTopicRelations, type TopicRelationSelection } from "@/server/portal-repository";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Params) {
  const { id } = await context.params;
  try {
    const body = await request.json() as {
      selections?: Partial<TopicRelationSelection>;
      replacements?: Record<string, string>;
    };
    const selections: TopicRelationSelection = {
      materials: body.selections?.materials || [],
      publications: body.selections?.publications || [],
      photos: body.selections?.photos || [],
      archive: body.selections?.archive || [],
      library: body.selections?.library || [],
      mapPlaces: body.selections?.mapPlaces || [],
    };
    return NextResponse.json(syncTopicRelations(id, selections, body.replacements || {}));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось обновить связи" },
      { status: 400 },
    );
  }
}
