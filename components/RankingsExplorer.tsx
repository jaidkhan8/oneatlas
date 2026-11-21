"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatScore } from "@/lib/format";

export type BenchmarkInfo = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  higherIsBetter: boolean;
  scoreCount: number;
};

export type LeaderboardRow = {
  id: string;
  benchmarkSlug: string;
  score: number;
  source: string | null;
  modelSlug: string;
  modelName: string;
  labName: string;
};

/**
 * Rankings explorer. The server loads every benchmark and every recorded
 * score once; switching category or benchmark then happens instantly in the
 * browser, with no server round-trip per click. The URL stays in sync
 * (shareable links still work) via history.replaceState.
 */
export default function RankingsExplorer({
  benchmarks,
  rows,
  initial,
}: {
  benchmarks: BenchmarkInfo[];
  rows: LeaderboardRow[];
  initial: { category?: string; benchmark?: string };
}) {
  const [category, setCategory] = useState<string>(initial.category ?? "");
  const [benchmarkSlug, setBenchmarkSlug] = useState<string>(
    initial.benchmark ?? ""
  );

  const categories = useMemo(
    () => [...new Set(benchmarks.map((b) => b.category))].sort(),
    [benchmarks]
  );

  const visibleBenchmarks = useMemo(
    () =>
      category
        ? benchmarks.filter((b) => b.category === category)
        : benchmarks,
    [benchmarks, category]
  );

  // Default to the benchmark with the most recorded scores.
  const selected = useMemo(() => {
    const bySlug = visibleBenchmarks.find((b) => b.slug === benchmarkSlug);
    if (bySlug) return bySlug;
    return [...visibleBenchmarks].sort(
      (a, b) => b.scoreCount - a.scoreCount
    )[0];
  }, [visibleBenchmarks, benchmarkSlug]);

  const leaderboard = useMemo(() => {
    if (!selected) return [];
    const list = rows.filter((r) => r.benchmarkSlug === selected.slug);
    return [...list].sort((a, b) =>
      selected.higherIsBetter ? b.score - a.score : a.score - b.score
    );
  }, [rows, selected]);

  // Keep the URL in sync without navigating (shareable links).
  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (selected) params.set("benchmark", selected.slug);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/rankings?${qs}` : "/rankings");
  }, [category, selected]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Rankings &amp; benchmarks</h1>
      <p className="mt-1 text-sm text-slate-500">
        Leaderboards built from publicly reported benchmark scores. Scores are
        shown only where a public source publishes them.
      </p>

      {/* Category filter */}
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={
            !category
              ? "rounded-full bg-indigo-600 px-3 py-1.5 font-medium text-white"
              : "rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 hover:bg-slate-200"
          }
        >
          All categories
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={
              category === c
                ? "rounded-full bg-indigo-600 px-3 py-1.5 font-medium text-white"
                : "rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 hover:bg-slate-200"
            }
          >
            {c}
          </button>
        ))}
      </div>

      {/* Benchmark tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {visibleBenchmarks.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBenchmarkSlug(b.slug)}
            className={
              selected?.id === b.id
                ? "rounded-lg border border-indigo-600 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
                : "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-slate-400"
            }
          >
            {b.name}
            <span className="ml-1 text-xs text-slate-400">
              ({b.scoreCount})
            </span>
          </button>
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
                    href={`/models/${row.modelSlug}`}
                    className="font-medium text-slate-900 hover:text-indigo-700"
                  >
                    {row.modelName}
                  </Link>
                  <span className="text-sm text-slate-500">{row.labName}</span>
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
