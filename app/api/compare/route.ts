import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/compare?slugs=a,b,c — full model records for the given slugs,
 * returned in the requested order (max 4). Powers the /compare page data.
 */
export async function GET(request: NextRequest) {
  try {
    const slugs = (request.nextUrl.searchParams.get("slugs") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
    if (slugs.length === 0) {
      return NextResponse.json({ models: [] });
    }
    const models = await prisma.model.findMany({
      where: { slug: { in: slugs } },
      include: {
        lab: true,
        providers: { include: { provider: true } },
        benchmarks: { include: { benchmark: true } },
      },
    });
    const bySlug = new Map(models.map((m) => [m.slug, m]));
    const ordered = slugs
      .map((s) => bySlug.get(s))
      .filter((m): m is NonNullable<typeof m> => Boolean(m));
    return NextResponse.json({ models: ordered });
  } catch (error) {
    console.error("GET /api/compare failed:", error);
    return NextResponse.json(
      { error: "Failed to load comparison." },
      { status: 500 }
    );
  }
}
