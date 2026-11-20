import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type ModelFilters = {
  q?: string;
  lab?: string;
  type?: string;
  capability?: string;
  modality?: string;
  openWeights?: boolean;
};

export function buildModelWhere(f: ModelFilters): Prisma.ModelWhereInput {
  const and: Prisma.ModelWhereInput[] = [];
  if (f.q) {
    and.push({
      OR: [
        { name: { contains: f.q, mode: "insensitive" } },
        { description: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }
  if (f.lab) and.push({ lab: { slug: f.lab } });
  if (f.type) and.push({ modelType: f.type });
  if (f.capability) and.push({ capabilities: { has: f.capability } });
  if (f.modality) and.push({ modalities: { has: f.modality } });
  if (f.openWeights) and.push({ openWeights: true });
  return and.length > 0 ? { AND: and } : {};
}

export type ModelSort =
  | "price-asc"
  | "price-desc"
  | "context-desc"
  | "newest"
  | "name";

export function buildModelOrderBy(
  sort: ModelSort
): Prisma.ModelOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":
      return { inputPricePer1M: { sort: "asc", nulls: "last" } };
    case "price-desc":
      return { inputPricePer1M: { sort: "desc", nulls: "last" } };
    case "context-desc":
      return { contextWindow: { sort: "desc", nulls: "last" } };
    case "newest":
      return { releaseDate: { sort: "desc", nulls: "last" } };
    case "name":
    default:
      return { name: "asc" };
  }
}

export const MODEL_LIST_INCLUDE = { lab: true } as const;

/** Paginated model list used by both the /models page and /api/models. */
export async function listModels(
  filters: ModelFilters,
  sort: ModelSort,
  page: number,
  perPage: number
) {
  const where = buildModelWhere(filters);
  const orderBy = buildModelOrderBy(sort);
  const [total, data] = await Promise.all([
    prisma.model.count({ where }),
    prisma.model.findMany({
      where,
      orderBy,
      include: MODEL_LIST_INCLUDE,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);
  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Parse the shared filter query params from a URLSearchParams-like object. */
export function parseModelFilters(
  params: Record<string, string | string[] | undefined>
): { filters: ModelFilters; sort: ModelSort; page: number } {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const sortRaw = first(params.sort);
  const sort: ModelSort =
    sortRaw === "price-asc" ||
    sortRaw === "price-desc" ||
    sortRaw === "context-desc" ||
    sortRaw === "newest" ||
    sortRaw === "name"
      ? sortRaw
      : "name";
  const page = Math.max(1, parseInt(first(params.page) ?? "1", 10) || 1);
  return {
    filters: {
      q: first(params.q) || undefined,
      lab: first(params.lab) || undefined,
      type: first(params.type) || undefined,
      capability: first(params.capability) || undefined,
      modality: first(params.modality) || undefined,
      openWeights: first(params.openWeights) === "true" || undefined,
    },
    sort,
    page,
  };
}
