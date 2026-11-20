import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=... — global search across models, labs and providers.
 * Used by the header search box.
 */
export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return NextResponse.json({ models: [], labs: [], providers: [] });
    }
    const [models, labs, providers] = await Promise.all([
      prisma.model.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { lab: true },
        orderBy: { name: "asc" },
        take: 8,
      }),
      prisma.lab.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        orderBy: { name: "asc" },
        take: 5,
      }),
      prisma.provider.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        orderBy: { name: "asc" },
        take: 5,
      }),
    ]);
    return NextResponse.json({
      models: models.map((m) => ({
        slug: m.slug,
        name: m.name,
        lab: m.lab.name,
        modelType: m.modelType,
      })),
      labs: labs.map((l) => ({ slug: l.slug, name: l.name })),
      providers: providers.map((p) => ({ slug: p.slug, name: p.name })),
    });
  } catch (error) {
    console.error("GET /api/search failed:", error);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
