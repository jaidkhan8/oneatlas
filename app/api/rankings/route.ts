import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/rankings?benchmark=<slug> — leaderboard for one benchmark,
 * highest score first (or lowest first when higherIsBetter is false).
 * GET /api/rankings — list of benchmarks with recorded-score counts.
 */
export async function GET(request: NextRequest) {
  try {
    const benchmarkSlug = request.nextUrl.searchParams.get("benchmark");
    if (!benchmarkSlug) {
      const benchmarks = await prisma.benchmark.findMany({
        include: { _count: { select: { scores: true } } },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ benchmarks });
    }
    const benchmark = await prisma.benchmark.findUnique({
      where: { slug: benchmarkSlug },
    });
    if (!benchmark) {
      return NextResponse.json(
        { error: "Benchmark not found." },
        { status: 404 }
      );
    }
    const rows = await prisma.modelBenchmark.findMany({
      where: { benchmarkId: benchmark.id, score: { not: null } },
      orderBy: benchmark.higherIsBetter
        ? { score: "desc" }
        : { score: "asc" },
      include: { model: { include: { lab: true } }, benchmark: true },
    });
    return NextResponse.json({ benchmark, leaderboard: rows });
  } catch (error) {
    console.error("GET /api/rankings failed:", error);
    return NextResponse.json(
      { error: "Failed to load rankings." },
      { status: 500 }
    );
  }
}
