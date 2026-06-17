import { NextResponse } from "next/server";
import { updatePage } from "@/server/portal-repository";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function PATCH(request: Request, context: Params) {
  const { slug } = await context.params;

  if (slug !== "home" && slug !== "about") {
    return NextResponse.json({ error: "Unknown page slug" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const page = updatePage(slug, body);
    return NextResponse.json({ page });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update page" },
      { status: 500 },
    );
  }
}
