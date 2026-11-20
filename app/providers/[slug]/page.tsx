import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatContext, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const provider = await prisma.provider.findUnique({ where: { slug } });
  if (!provider) return { title: "Provider not found — OneAtlas" };
  return {
    title: `${provider.name} — OneAtlas`,
    description: provider.description ?? undefined,
  };
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = await prisma.provider.findUnique({
    where: { slug },
    include: {
      models: {
        include: { model: { include: { lab: true } } },
        orderBy: { model: { name: "asc" } },
      },
    },
  });
  if (!provider) notFound();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-slate-500">
          <Link href="/providers" className="hover:underline">
            Providers
          </Link>
          {" / "}
          {provider.name}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{provider.name}</h1>
        {provider.description && (
          <p className="mt-2 max-w-3xl text-slate-700">
            {provider.description}
          </p>
        )}
        <p className="mt-3 text-sm text-slate-600">
          Type: <span className="font-medium text-slate-900">{provider.type}</span>
          {provider.website && (
            <>
              {" · "}
              <a
                href={provider.website}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-indigo-600 hover:underline"
              >
                {provider.website.replace(/^https?:\/\//, "")} ↗
              </a>
            </>
          )}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">
          Models available ({provider.models.length})
        </h2>
        {provider.models.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No models recorded for this provider yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium">Lab</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Context</th>
                  <th className="px-4 py-2 font-medium">Input / 1M</th>
                  <th className="px-4 py-2 font-medium">Output / 1M</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {provider.models.map(({ model }) => (
                  <tr key={model.id}>
                    <td className="px-4 py-2">
                      <Link
                        href={`/models/${model.slug}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {model.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {model.lab.name}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {model.modelType}
                    </td>
                    <td className="px-4 py-2">
                      {formatContext(model.contextWindow)}
                    </td>
                    <td className="px-4 py-2">
                      {formatPrice(model.inputPricePer1M)}
                    </td>
                    <td className="px-4 py-2">
                      {formatPrice(model.outputPricePer1M)}
                    </td>
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
