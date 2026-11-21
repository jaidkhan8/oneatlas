"use client";

import { useEffect, useMemo, useState } from "react";
import ModelCard from "./ModelCard";
import type { SerializedModelWithLab } from "@/lib/types";
import type { ModelFilters, ModelSort } from "@/lib/queries";

const PER_PAGE = 12;

const SORT_OPTIONS: { value: ModelSort; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "price-asc", label: "Input price: low to high" },
  { value: "price-desc", label: "Input price: high to low" },
  { value: "context-desc", label: "Largest context window" },
  { value: "newest", label: "Newest first" },
];

const CAPABILITIES = ["reasoning", "tool-use", "vision", "multilingual"];
const MODALITIES = ["text", "image", "audio", "video"];
const MODEL_TYPES = [
  "chat",
  "reasoning",
  "multimodal",
  "embedding",
  "image",
  "audio",
  "code",
];

type FiltersState = {
  q: string;
  lab: string;
  type: string;
  capability: string;
  modality: string;
  openWeights: boolean;
};

function sortModels(models: SerializedModelWithLab[], sort: ModelSort) {
  const arr = [...models];
  switch (sort) {
    case "price-asc":
      return arr.sort(
        (a, b) => (a.inputPricePer1M ?? Infinity) - (b.inputPricePer1M ?? Infinity)
      );
    case "price-desc":
      return arr.sort(
        (a, b) => (b.inputPricePer1M ?? -Infinity) - (a.inputPricePer1M ?? -Infinity)
      );
    case "context-desc":
      return arr.sort(
        (a, b) => (b.contextWindow ?? -1) - (a.contextWindow ?? -1)
      );
    case "newest":
      return arr.sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return b.releaseDate.localeCompare(a.releaseDate);
      });
    case "name":
    default:
      return arr.sort((a, b) => a.name.localeCompare(b.name));
  }
}

/**
 * Browse-models explorer. The server loads all models once; every filter,
 * sort, search and page change then happens instantly in the browser, with
 * no server round-trip per click. The URL stays in sync (shareable links
 * still work) via history.replaceState, which triggers no navigation.
 */
export default function ModelsExplorer({
  models,
  labs,
  initial,
}: {
  models: SerializedModelWithLab[];
  labs: { slug: string; name: string; count: number }[];
  initial: { filters: ModelFilters; sort: ModelSort; page: number };
}) {
  const [filters, setFilters] = useState<FiltersState>({
    q: initial.filters.q ?? "",
    lab: initial.filters.lab ?? "",
    type: initial.filters.type ?? "",
    capability: initial.filters.capability ?? "",
    modality: initial.filters.modality ?? "",
    openWeights: initial.filters.openWeights ?? false,
  });
  const [sort, setSort] = useState<ModelSort>(initial.sort);
  const [page, setPage] = useState<number>(initial.page);

  // Keep the URL in sync without navigating (shareable filter links).
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.lab) params.set("lab", filters.lab);
    if (filters.type) params.set("type", filters.type);
    if (filters.capability) params.set("capability", filters.capability);
    if (filters.modality) params.set("modality", filters.modality);
    if (filters.openWeights) params.set("openWeights", "true");
    if (sort !== "name") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/models?${qs}` : "/models");
  }, [filters, sort, page]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const list = models.filter((m) => {
      if (
        q &&
        !(
          m.name.toLowerCase().includes(q) ||
          (m.description ?? "").toLowerCase().includes(q)
        )
      )
        return false;
      if (filters.lab && m.lab.slug !== filters.lab) return false;
      if (filters.type && m.modelType !== filters.type) return false;
      if (filters.capability && !m.capabilities.includes(filters.capability))
        return false;
      if (filters.modality && !m.modalities.includes(filters.modality))
        return false;
      if (filters.openWeights && !m.openWeights) return false;
      return true;
    });
    return sortModels(list, sort);
  }, [models, filters, sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageModels = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  );

  // Every filter/sort change restarts at page 1.
  function updateFilters(patch: Partial<FiltersState>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }
  function changeSort(next: ModelSort) {
    setSort(next);
    setPage(1);
  }

  const hasActiveFilter =
    filters.q ||
    filters.lab ||
    filters.type ||
    filters.capability ||
    filters.modality ||
    filters.openWeights;

  return (
    <div>
      <h1 className="text-2xl font-bold">Browse models</h1>
      <p className="mt-1 text-sm text-slate-500">
        {total} model{total === 1 ? "" : "s"} · prices are USD per 1M tokens
        (public list prices, Nov 2026)
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filters */}
        <aside className="space-y-6 text-sm">
          <div className="space-y-2">
            <label className="block font-medium" htmlFor="models-search">
              Search
            </label>
            <input
              id="models-search"
              value={filters.q}
              onChange={(e) => updateFilters({ q: e.target.value })}
              placeholder="Model name…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <h2 className="font-medium">Lab / company</h2>
            <ul className="mt-2 space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => updateFilters({ lab: "" })}
                  className={
                    !filters.lab
                      ? "font-semibold text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  }
                >
                  All labs
                </button>
              </li>
              {labs.map((lab) => (
                <li key={lab.slug}>
                  <button
                    type="button"
                    onClick={() => updateFilters({ lab: lab.slug })}
                    className={
                      filters.lab === lab.slug
                        ? "font-semibold text-indigo-700"
                        : "text-slate-600 hover:text-slate-900"
                    }
                  >
                    {lab.name} ({lab.count})
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-medium">Model type</h2>
            <ul className="mt-2 space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => updateFilters({ type: "" })}
                  className={
                    !filters.type
                      ? "font-semibold text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  }
                >
                  All types
                </button>
              </li>
              {MODEL_TYPES.map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => updateFilters({ type: t })}
                    className={
                      filters.type === t
                        ? "font-semibold text-indigo-700"
                        : "text-slate-600 hover:text-slate-900"
                    }
                  >
                    {t}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-medium">Capability</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CAPABILITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    updateFilters({
                      capability: filters.capability === c ? "" : c,
                    })
                  }
                  className={
                    filters.capability === c
                      ? "rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white"
                      : "rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-medium">Modality</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MODALITIES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    updateFilters({
                      modality: filters.modality === m ? "" : m,
                    })
                  }
                  className={
                    filters.modality === m
                      ? "rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white"
                      : "rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() =>
                updateFilters({ openWeights: !filters.openWeights })
              }
              className={
                filters.openWeights
                  ? "font-semibold text-indigo-700"
                  : "text-slate-600 hover:text-slate-900"
              }
            >
              {filters.openWeights ? "✓ " : ""}Open weights only
            </button>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() =>
                updateFilters({
                  q: "",
                  lab: "",
                  type: "",
                  capability: "",
                  modality: "",
                  openWeights: false,
                })
              }
              className="inline-block text-indigo-600 hover:text-indigo-800"
            >
              Clear all filters
            </button>
          )}
        </aside>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Page {safePage} of {totalPages}
            </p>
            <label className="flex items-center gap-2 text-sm">
              Sort by
              <select
                value={sort}
                onChange={(e) => changeSort(e.target.value as ModelSort)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-indigo-500"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {pageModels.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No models match these filters.{" "}
              <button
                type="button"
                onClick={() =>
                  updateFilters({
                    q: "",
                    lab: "",
                    type: "",
                    capability: "",
                    modality: "",
                    openWeights: false,
                  })
                }
                className="text-indigo-600 hover:underline"
              >
                Clear filters
              </button>
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pageModels.map((m) => (
                <ModelCard key={m.id} model={m} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
              {safePage > 1 && (
                <button
                  type="button"
                  onClick={() => setPage(safePage - 1)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                >
                  ← Previous
                </button>
              )}
              <span className="text-slate-500">
                Page {safePage} of {totalPages}
              </span>
              {safePage < totalPages && (
                <button
                  type="button"
                  onClick={() => setPage(safePage + 1)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                >
                  Next →
                </button>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
