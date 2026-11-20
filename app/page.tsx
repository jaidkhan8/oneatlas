import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SearchBar from "@/components/SearchBar";
import ModelCard from "@/components/ModelCard";
import { formatScore } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [modelCount, labCount, providerCount, benchmarkCount] =
    await Promise.all([
      prisma.model.count(),
      prisma.lab.count(),
      prisma.provider.count(),
      prisma.benchmark.count(),
    ]);

  const newest = await prisma.model.findMany({
    orderBy: { releaseDate: { sort: "desc", nulls: "last" } },
    include: { lab: true },
    take: 6,
  });

  const sweBench = await prisma.benchmark.findUnique({
    where: { slug: "swe-bench-verified" },
  });
  const sweTop = sweBench
    ? await prisma.modelBenchmark.findMany({
        where: { benchmarkId: sweBench.id, score: { not: null } },
        orderBy: { score: "desc" },
        include: { model: { include: { lab: true } }, benchmark: true },
        take: 5,
      })
    : [];

  const labs = await prisma.lab.findMany({
    include: { _count: { select: { models: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="rounded-2xl bg-slate-900 px-6 py-12 text-white sm:px-12">
        <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          Discover, compare and evaluate AI models — in one place.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          OneAtlas tracks models across providers: pricing, context windows,
          capabilities and benchmark scores, so you can pick the right model
          for the job instead of guessing.
        </p>
        <div className="mt-6 max-w-xl">
          <SearchBar />
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <Link
            href="/models"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500"
          >
            Browse all models
          </Link>
          <Link
            href="/rankings"
            className="rounded-lg bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20"
          >
            View rankings
          </Link>
          <Link
            href="/compare"
            className="rounded-lg bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20"
          >
            Compare models
          </Link>
        </div>
        <dl className="mt-8 grid max-w-xl grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-400">Models</dt>
            <dd className="text-2xl font-bold">{modelCount}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Labs</dt>
            <dd className="text-2xl font-bold">{labCount}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Providers</dt>
            <dd className="text-2xl font-bold">{providerCount}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Benchmarks</dt>
            <dd className="text-2xl font-bold">{benchmarkCount}</dd>
          </div>
        </dl>
      </section>

      {/* Newest models */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">Newest models</h2>
          <Link
            href="/models?sort=newest"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            See all →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {newest.map((m) => (
            <ModelCard key={m.id} model={m} />
          ))}
        </div>
      </section>

      {/* Benchmark spotlight */}
      {sweTop.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">
              Top on SWE-bench Verified (coding)
            </h2>
            <Link
              href="/rankings?benchmark=swe-bench-verified"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Full leaderboard →
            </Link>
          </div>
          <ol className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {sweTop.map((row, i) => (
              <li key={row.id} className="flex items-center gap-4 px-4 py-3">
                <span className="w-6 text-center text-sm font-bold text-slate-400">
                  {i + 1}
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
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-slate-500">
            Scores shown only where a public source publishes them — see the
            rankings page for sources.
          </p>
        </section>
      )}

      {/* Labs */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">AI labs</h2>
          <Link
            href="/labs"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            All labs →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {labs.map((lab) => (
            <Link
              key={lab.id}
              href={`/labs/${lab.slug}`}
              className="rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm"
            >
              <p className="font-semibold text-slate-900">{lab.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {lab._count.models} model{lab._count.models === 1 ? "" : "s"}
                {lab.headquarters ? ` · ${lab.headquarters}` : ""}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
