import { prisma } from "@/lib/prisma";
import ModelsExplorer from "@/components/ModelsExplorer";
import { parseModelFilters } from "@/lib/queries";
import type { SerializedModelWithLab } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Browse-models page. The server loads the full model list (25 models) and
 * the lab list once; ModelsExplorer then filters, sorts, searches and
 * paginates instantly in the browser, so a filter click never waits on a
 * server round-trip.
 */
export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { filters, sort, page } = parseModelFilters(sp);

  const [models, labs] = await Promise.all([
    prisma.model.findMany({
      include: { lab: true },
      orderBy: { name: "asc" },
    }),
    prisma.lab.findMany({
      include: { _count: { select: { models: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // Dates become ISO strings so the data can cross into the client component.
  const serializedModels = JSON.parse(
    JSON.stringify(models)
  ) as SerializedModelWithLab[];
  const labList = labs.map((lab) => ({
    slug: lab.slug,
    name: lab.name,
    count: lab._count.models,
  }));

  return (
    <ModelsExplorer
      models={serializedModels}
      labs={labList}
      initial={{ filters, sort, page }}
    />
  );
}
