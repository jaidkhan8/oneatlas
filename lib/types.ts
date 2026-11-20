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
