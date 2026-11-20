import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/models/[slug] — full model detail with lab, providers, benchmarks. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const model = await prisma.model.findUnique({
      where: { slug },
      include: {
        lab: true,
        providers: {
          include: { provider: true },
          orderBy: { provider: { name: "asc" } },
        },
        benchmarks: {
          include: { benchmark: true },
          orderBy: { benchmark: { name: "asc" } },
        },
      },
    });
    if (!model) {
      return NextResponse.json({ error: "Model not found." }, { status: 404 });
    }
    return NextResponse.json(model);
  } catch (error) {
    console.error("GET /api/models/[slug] failed:", error);
    return NextResponse.json(
      { error: "Failed to load model." },
      { status: 500 }
    );
  }
}
