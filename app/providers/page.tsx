import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const providers = await prisma.provider.findMany({
    include: { _count: { select: { models: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Providers</h1>
      <p className="mt-1 text-sm text-slate-500">
        APIs, clouds and aggregators where you can actually call these models.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <Link
            key={p.id}
            href={`/providers/${p.slug}`}
            className="rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm"
          >
            <p className="text-lg font-semibold text-slate-900">{p.name}</p>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">
              {p.description}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {p._count.models} model{p._count.models === 1 ? "" : "s"} ·{" "}
              {p.type}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
