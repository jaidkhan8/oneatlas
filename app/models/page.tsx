import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ModelCard from "@/components/ModelCard";
import SortSelect from "@/components/SortSelect";
import {
  listModels,
  parseModelFilters,
  type ModelSort,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

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

function hrefWith(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "") params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/models?${qs}` : "/models";
}

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { filters, sort, page } = parseModelFilters(sp);
  const { data, total, totalPages } = await listModels(
    filters,
    sort,
    page,
    PER_PAGE
  );

  const labs = await prisma.lab.findMany({
    include: { _count: { select: { models: true } } },
    orderBy: { name: "asc" },
  });

  const current: Record<string, string | undefined> = {
    q: filters.q,
    lab: filters.lab,
    type: filters.type,
    capability: filters.capability,
    modality: filters.modality,
    openWeights: filters.openWeights ? "true" : undefined,
    sort,
  };

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
          <form action="/models" method="get" className="space-y-2">
            <label className="block font-medium">Search</label>
            <div className="flex gap-2">
              <input
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Model name…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-500"
              >
                Go
              </button>
            </div>
            {filters.lab && <input type="hidden" name="lab" value={filters.lab} />}
            {filters.type && <input type="hidden" name="type" value={filters.type} />}
            {filters.capability && (
              <input type="hidden" name="capability" value={filters.capability} />
            )}
            {filters.modality && (
              <input type="hidden" name="modality" value={filters.modality} />
            )}
            {filters.openWeights && (
              <input type="hidden" name="openWeights" value="true" />
            )}
            {sort && <input type="hidden" name="sort" value={sort} />}
          </form>

          <div>
            <h2 className="font-medium">Lab / company</h2>
            <ul className="mt-2 space-y-1">
              <li>
                <Link
                  href={hrefWith(current, { lab: undefined, page: undefined })}
                  className={
                    !filters.lab
                      ? "font-semibold text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  }
                >
                  All labs
                </Link>
              </li>
              {labs.map((lab) => (
                <li key={lab.id}>
                  <Link
                    href={hrefWith(current, { lab: lab.slug, page: undefined })}
                    className={
                      filters.lab === lab.slug
                        ? "font-semibold text-indigo-700"
                        : "text-slate-600 hover:text-slate-900"
                    }
                  >
                    {lab.name} ({lab._count.models})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-medium">Model type</h2>
            <ul className="mt-2 space-y-1">
              <li>
                <Link
                  href={hrefWith(current, { type: undefined, page: undefined })}
                  className={
                    !filters.type
                      ? "font-semibold text-indigo-700"
                      : "text-slate-600 hover:text-slate-900"
                  }
                >
                  All types
                </Link>
              </li>
              {MODEL_TYPES.map((t) => (
                <li key={t}>
                  <Link
                    href={hrefWith(current, { type: t, page: undefined })}
                    className={
                      filters.type === t
                        ? "font-semibold text-indigo-700"
                        : "text-slate-600 hover:text-slate-900"
                    }
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-medium">Capability</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CAPABILITIES.map((c) => (
                <Link
                  key={c}
                  href={hrefWith(current, {
                    capability: filters.capability === c ? undefined : c,
                    page: undefined,
                  })}
                  className={
                    filters.capability === c
                      ? "rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white"
                      : "rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
                  }
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-medium">Modality</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MODALITIES.map((m) => (
                <Link
                  key={m}
                  href={hrefWith(current, {
                    modality: filters.modality === m ? undefined : m,
                    page: undefined,
                  })}
                  className={
                    filters.modality === m
                      ? "rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white"
                      : "rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
                  }
                >
                  {m}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <Link
              href={hrefWith(current, {
                openWeights: filters.openWeights ? undefined : "true",
                page: undefined,
              })}
              className={
                filters.openWeights
                  ? "font-semibold text-indigo-700"
                  : "text-slate-600 hover:text-slate-900"
              }
            >
              {filters.openWeights ? "✓ " : ""}Open weights only
            </Link>
          </div>

          {(filters.q ||
            filters.lab ||
            filters.type ||
            filters.capability ||
            filters.modality ||
            filters.openWeights) && (
            <Link
              href="/models"
              className="inline-block text-indigo-600 hover:text-indigo-800"
            >
              Clear all filters
            </Link>
          )}
        </aside>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <SortSelect
              value={sort}
              options={SORT_OPTIONS}
              baseParams={current}
            />
          </div>

          {data.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No models match these filters.{" "}
              <Link href="/models" className="text-indigo-600 hover:underline">
                Clear filters
              </Link>
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.map((m) => (
                <ModelCard key={m.id} model={m} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
              {page > 1 && (
                <Link
                  href={hrefWith(current, { page: String(page - 1) })}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-slate-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={hrefWith(current, { page: String(page + 1) })}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                >
                  Next →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
