import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatScore } from "@/lib/format";

export const dynamic = "force-dynamic";

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

  const categories = await prisma.benchmark.findMany({
    distinct: ["category"],
    select: { category: true },
  });
  const categoryList = categories.map((c) => c.category).sort();

  const benchmarks = await prisma.benchmark.findMany({
    where: categoryParam ? { category: categoryParam } : undefined,
    include: {
      _count: { select: { scores: true } },
    },
    orderBy: { name: "asc" },
  });

  // Default to the benchmark with the most recorded scores.
  const selected =
    benchmarks.find((b) => b.slug === benchmarkParam) ??
    [...benchmarks].sort((a, b) => b._count.scores - a._count.scores)[0];

  const leaderboard = selected
    ? await prisma.modelBenchmark.findMany({
        where: { benchmarkId: selected.id, score: { not: null } },
        orderBy: selected.higherIsBetter
          ? { score: "desc" }
          : { score: "asc" },
        include: { model: { include: { lab: true } }, benchmark: true },
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Rankings &amp; benchmarks</h1>
      <p className="mt-1 text-sm text-slate-500">
        Leaderboards built from publicly reported benchmark scores. Scores are
        shown only where a public source publishes them.
      </p>

      {/* Category filter */}
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link
          href="/rankings"
          className={
            !categoryParam
              ? "rounded-full bg-indigo-600 px-3 py-1.5 font-medium text-white"
              : "rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 hover:bg-slate-200"
          }
        >
          All categories
        </Link>
        {categoryList.map((c) => (
          <Link
            key={c}
            href={`/rankings?category=${c}`}
            className={
              categoryParam === c
                ? "rounded-full bg-indigo-600 px-3 py-1.5 font-medium text-white"
                : "rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 hover:bg-slate-200"
            }
          >
            {c}
          </Link>
        ))}
      </div>

      {/* Benchmark tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {benchmarks.map((b) => (
          <Link
            key={b.id}
            href={`/rankings?benchmark=${b.slug}${
              categoryParam ? `&category=${categoryParam}` : ""
            }`}
            className={
              selected?.id === b.id
                ? "rounded-lg border border-indigo-600 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
                : "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-slate-400"
            }
          >
            {b.name}
            <span className="ml-1 text-xs text-slate-400">
              ({b._count.scores})
            </span>
          </Link>
        ))}
      </div>

      {selected && (
        <section className="mt-6">
          <h2 className="text-lg font-bold">{selected.name}</h2>
          <p className="text-sm text-slate-500">{selected.description}</p>
          {leaderboard.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No verified scores recorded for this benchmark yet.
            </p>
          ) : (
            <ol className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
              {leaderboard.map((row, i) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <span className="w-7 text-center text-sm font-bold text-slate-400">
                    #{i + 1}
                  </span>
                  <Link
                    href={`/models/${row.model.slug}`}
                    className="font-medium text-slate-900 hover:text-indigo-700"
                  >
                    {row.model.name}
                  </Link>
                  <span className="text-sm text-slate-500">
                    {row.model.lab.name}
                  </span>
                  <span className="ml-auto text-sm font-semibold">
                    {formatScore(row.score)}
                  </span>
                  {row.source && (
                    <span className="w-full text-xs text-slate-400 sm:w-auto">
                      Source: {row.source}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
