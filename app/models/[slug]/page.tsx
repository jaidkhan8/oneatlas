import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CompareButton from "@/components/CompareButton";
import ModelCard from "@/components/ModelCard";
import { formatContext, formatDate, formatPrice, formatScore } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = await prisma.model.findUnique({
    where: { slug },
    include: { lab: true },
  });
  if (!model) return { title: "Model not found — OneAtlas" };
  return {
    title: `${model.name} by ${model.lab.name} — OneAtlas`,
    description: model.description ?? undefined,
  };
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = await prisma.model.findUnique({
    where: { slug },
    include: {
      lab: true,
      providers: { include: { provider: true }, orderBy: { provider: { name: "asc" } } },
      benchmarks: { include: { benchmark: true }, orderBy: { benchmark: { name: "asc" } } },
    },
  });
  if (!model) notFound();

  const related = await prisma.model.findMany({
    where: { labId: model.labId, id: { not: model.id } },
    include: { lab: true },
    orderBy: { releaseDate: { sort: "desc", nulls: "last" } },
    take: 3,
  });

  return (
    <div className="space-y-10">
      {/* Header */}
      <section>
        <p className="text-sm text-slate-500">
          <Link href="/models" className="hover:underline">
            Models
          </Link>
          {" / "}
          <Link href={`/labs/${model.lab.slug}`} className="hover:underline">
            {model.lab.name}
          </Link>
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{model.name}</h1>
            <p className="mt-1 text-slate-600">
              {model.lab.name} · {model.modelType}
              {model.status !== "active" && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {model.status}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <CompareButton slug={model.slug} />
            {model.website && (
              <a
                href={model.website}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                Official page ↗
              </a>
            )}
          </div>
        </div>
        {model.description && (
          <p className="mt-4 max-w-3xl text-slate-700">{model.description}</p>
        )}
      </section>

      {/* Specs */}
      <section>
        <h2 className="text-lg font-bold">Specifications</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Input price / 1M tokens
            </dt>
            <dd className="mt-1 text-xl font-bold">
              {formatPrice(model.inputPricePer1M)}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Output price / 1M tokens
            </dt>
            <dd className="mt-1 text-xl font-bold">
              {formatPrice(model.outputPricePer1M)}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Context window
            </dt>
            <dd className="mt-1 text-xl font-bold">
              {formatContext(model.contextWindow)}
              <span className="text-sm font-normal text-slate-500"> tokens</span>
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Released
            </dt>
            <dd className="mt-1 text-xl font-bold">
              {formatDate(model.releaseDate)}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Modalities
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {model.modalities.length > 0 ? model.modalities.join(", ") : "—"}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Capabilities
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {model.capabilities.length > 0
                ? model.capabilities.join(", ")
                : "—"}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Open weights
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {model.openWeights
                ? `Yes${model.license ? ` · ${model.license}` : ""}`
                : "No (proprietary)"}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Lab
            </dt>
            <dd className="mt-1 text-sm font-medium">
              <Link
                href={`/labs/${model.lab.slug}`}
                className="text-indigo-600 hover:underline"
              >
                {model.lab.name}
              </Link>
              {model.lab.headquarters ? ` · ${model.lab.headquarters}` : ""}
            </dd>
          </div>
        </dl>
      </section>

      {/* Providers */}
      <section>
        <h2 className="text-lg font-bold">Available on</h2>
        {model.providers.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No provider listing recorded for this model.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {model.providers.map(({ provider }) => (
              <li key={provider.id}>
                <Link
                  href={`/providers/${provider.slug}`}
                  className="inline-block rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
                >
                  {provider.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Benchmarks */}
      <section>
        <h2 className="text-lg font-bold">Benchmarks</h2>
        {model.benchmarks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No benchmark scores recorded for this model.
          </p>
        ) : (
          <table className="mt-3 w-full overflow-hidden rounded-xl border border-slate-200 text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Benchmark</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Score</th>
                <th className="px-4 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {model.benchmarks.map(({ benchmark, score, source, verified }) => (
                <tr key={benchmark.id}>
                  <td className="px-4 py-2 font-medium">{benchmark.name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {benchmark.category}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    {score !== null ? formatScore(score) : "Not verified"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {source ?? "—"}
                    {verified && score !== null ? " ✓" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Scores are shown only where a public source publishes them. Anything
          unverified is left blank rather than estimated.
        </p>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">More from {model.lab.name}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
