import type { Prisma } from "@prisma/client";

export type ModelWithLab = Prisma.ModelGetPayload<{
  include: { lab: true };
}>;

export type ModelWithRelations = Prisma.ModelGetPayload<{
  include: {
    lab: true;
    providers: { include: { provider: true } };
    benchmarks: { include: { benchmark: true } };
  };
}>;

export type LabWithCount = Prisma.LabGetPayload<{
  include: { _count: { select: { models: true } } };
}>;

export type ProviderWithCount = Prisma.ProviderGetPayload<{
  include: { _count: { select: { models: true } } };
}>;

export type BenchmarkScoreRow = Prisma.ModelBenchmarkGetPayload<{
  include: { model: { include: { lab: true } }; benchmark: true };
}>;

/** Model + lab with Date fields serialised to ISO strings (safe to pass to client components). */
export type SerializedModelWithLab = Omit<
  ModelWithLab,
  "releaseDate" | "createdAt" | "updatedAt"
> & {
  releaseDate: string | null;
  createdAt: string;
  updatedAt: string;
};
