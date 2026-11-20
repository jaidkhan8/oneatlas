import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CompareLoader from "@/components/CompareLoader";
import { formatContext, formatDate, formatPrice, formatScore } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp.models;
  const slugs = (
    Array.isArray(raw) ? raw.join(",") : (raw ?? "")
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (slugs.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Compare models</h1>
        <p className="mt-2 max-w-xl text-slate-600">
          Pick up to 4 models to compare side by side — pricing, context
          window, capabilities and benchmark scores.
        </p>
        <div className="mt-4">
          <CompareLoader />
        </div>
        <Link
          href="/models"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Browse models
        </Link>
      </div>
    );
  }

  const models = await prisma.model.findMany({
    where: { slug: { in: slugs } },
    include: {
      lab: true,
      providers: { include: { provider: true } },
      benchmarks: { include: { benchmark: true } },
    },
  });
  // Keep the requested order.
  const bySlug = new Map(models.map((m) => [m.slug, m]));
  const ordered = slugs
    .map((s) => bySlug.get(s))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  if (ordered.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Compare models</h1>
        <p className="mt-2 text-slate-600">
          None of the requested models were found.{" "}
          <Link href="/models" className="text-indigo-600 hover:underline">
            Browse models
          </Link>
        </p>
      </div>
    );
  }

  // Every benchmark that appears on any compared model.
  const benchmarkNames = Array.from(
    new Map(
      ordered.flatMap((m) =>
        m.benchmarks.map((b) => [b.benchmark.slug, b.benchmark.name])
      )
    ).entries()
  );

  const rows: { label: string; values: string[] }[] = [
    { label: "Lab", values: ordered.map((m) => m.lab.name) },
    { label: "Type", values: ordered.map((m) => m.modelType) },
    { label: "Status", values: ordered.map((m) => m.status) },
    {
      label: "Context window",
      values: ordered.map((m) => `${formatContext(m.contextWindow)} tokens`),
    },
    {
      label: "Input price / 1M",
      values: ordered.map((m) => formatPrice(m.inputPricePer1M)),
    },
    {
      label: "Output price / 1M",
      values: ordered.map((m) => formatPrice(m.outputPricePer1M)),
    },
    {
      label: "Released",
      values: ordered.map((m) => formatDate(m.releaseDate)),
    },
    {
      label: "Modalities",
      values: ordered.map((m) =>
        m.modalities.length > 0 ? m.modalities.join(", ") : "—"
      ),
    },
    {
      label: "Capabilities",
      values: ordered.map((m) =>
        m.capabilities.length > 0 ? m.capabilities.join(", ") : "—"
      ),
    },
    {
      label: "Open weights",
      values: ordered.map((m) =>
        m.openWeights ? `Yes${m.license ? ` (${m.license})` : ""}` : "No"
      ),
    },
    {
      label: "Providers",
      values: ordered.map((m) =>
        m.providers.length > 0
          ? m.providers.map((p) => p.provider.name).join(", ")
          : "—"
      ),
    },
  ];

  for (const [slug, name] of benchmarkNames) {
    rows.push({
      label: name,
      values: ordered.map((m) => {
        const found = m.benchmarks.find((b) => b.benchmark.slug === slug);
        return found && found.score !== null
          ? formatScore(found.score)
          : "—";
      }),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Compare models</h1>
      <p className="mt-1 text-sm text-slate-500">
        Side-by-side comparison. Prices are USD per 1M tokens.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-40 px-4 py-3 text-left font-medium text-slate-500">
                Attribute
              </th>
              {ordered.map((m) => (
                <th key={m.id} className="px-4 py-3 text-left">
                  <Link
                    href={`/models/${m.slug}`}
                    className="font-semibold text-indigo-700 hover:underline"
                  >
                    {m.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="px-4 py-2.5 font-medium text-slate-500">
                  {row.label}
                </td>
                {row.values.map((v, i) => (
                  <td key={i} className="px-4 py-2.5 align-top">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ordered.length < 2 && (
        <p className="mt-4 text-sm text-slate-500">
          Add at least one more model to compare. Browse{" "}
          <Link href="/models" className="text-indigo-600 hover:underline">
            all models
          </Link>{" "}
          and use “+ Compare”.
        </p>
      )}
    </div>
  );
}
