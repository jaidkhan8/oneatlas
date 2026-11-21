import { prisma } from "@/lib/prisma";
import RankingsExplorer, {
  type BenchmarkInfo,
  type LeaderboardRow,
} from "@/components/RankingsExplorer";

export const dynamic = "force-dynamic";

/**
 * Rankings page. The server loads every benchmark and every recorded score
 * once (two queries in parallel); RankingsExplorer then switches category
 * and benchmark instantly in the browser, so a tab click never waits on a
 * server round-trip.
 */
export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const categoryParam =
    typeof sp.category === "string" ? sp.category : undefined;
  const benchmarkParam =
    typeof sp.benchmark === "string" ? sp.benchmark : undefined;

  const [benchmarks, scoreRows] = await Promise.all([
    prisma.benchmark.findMany({
      include: { _count: { select: { scores: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.modelBenchmark.findMany({
      where: { score: { not: null } },
      include: { model: { include: { lab: true } }, benchmark: true },
    }),
  ]);

  const benchmarkList: BenchmarkInfo[] = benchmarks.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    category: b.category,
    higherIsBetter: b.higherIsBetter,
    scoreCount: b._count.scores,
  }));

  const rows: LeaderboardRow[] = scoreRows.map((r) => ({
    id: r.id,
    benchmarkSlug: r.benchmark.slug,
    score: r.score as number,
    source: r.source,
    modelSlug: r.model.slug,
    modelName: r.model.name,
    labName: r.model.lab.name,
  }));

  return (
    <RankingsExplorer
      benchmarks={benchmarkList}
      rows={rows}
      initial={{ category: categoryParam, benchmark: benchmarkParam }}
    />
  );
}
