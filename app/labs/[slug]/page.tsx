import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatContext, formatDate, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lab = await prisma.lab.findUnique({ where: { slug } });
  if (!lab) return { title: "Lab not found — OneAtlas" };
  return {
    title: `${lab.name} — OneAtlas`,
    description: lab.description ?? undefined,
  };
}

export default async function LabDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lab = await prisma.lab.findUnique({
    where: { slug },
    include: {
      models: {
        include: { lab: true },
        orderBy: { releaseDate: { sort: "desc", nulls: "last" } },
      },
    },
  });
  if (!lab) notFound();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-slate-500">
          <Link href="/labs" className="hover:underline">
            Labs
          </Link>
          {" / "}
          {lab.name}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{lab.name}</h1>
        {lab.description && (
          <p className="mt-2 max-w-3xl text-slate-700">{lab.description}</p>
        )}
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
          {lab.foundedYear && (
            <div>
              <dt className="inline text-slate-400">Founded: </dt>
              <dd className="inline font-medium text-slate-900">
                {lab.foundedYear}
              </dd>
            </div>
          )}
          {lab.headquarters && (
            <div>
              <dt className="inline text-slate-400">Headquarters: </dt>
              <dd className="inline font-medium text-slate-900">
                {lab.headquarters}
              </dd>
            </div>
          )}
          <div>
            <dt className="inline text-slate-400">Type: </dt>
            <dd className="inline font-medium text-slate-900">
              {lab.type === "research-lab" ? "Research lab" : "Company"}
            </dd>
          </div>
          {lab.website && (
            <a
              href={lab.website}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-indigo-600 hover:underline"
            >
              {lab.website.replace(/^https?:\/\//, "")} ↗
            </a>
          )}
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-bold">
          Models ({lab.models.length})
        </h2>
        {lab.models.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No models recorded for this lab yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Context</th>
                  <th className="px-4 py-2 font-medium">Input / 1M</th>
                  <th className="px-4 py-2 font-medium">Output / 1M</th>
                  <th className="px-4 py-2 font-medium">Released</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lab.models.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2">
                      <Link
                        href={`/models/${m.slug}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {m.name}
                      </Link>
                      {m.status !== "active" && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          {m.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{m.modelType}</td>
                    <td className="px-4 py-2">
                      {formatContext(m.contextWindow)}
                    </td>
                    <td className="px-4 py-2">
                      {formatPrice(m.inputPricePer1M)}
                    </td>
                    <td className="px-4 py-2">
                      {formatPrice(m.outputPricePer1M)}
                    </td>
                    <td className="px-4 py-2">{formatDate(m.releaseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
