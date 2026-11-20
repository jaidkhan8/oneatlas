import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LabsPage() {
  const labs = await prisma.lab.findMany({
    include: { _count: { select: { models: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">AI labs &amp; companies</h1>
      <p className="mt-1 text-sm text-slate-500">
        The labs and companies building the models in OneAtlas.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => (
          <Link
            key={lab.id}
            href={`/labs/${lab.slug}`}
            className="rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm"
          >
            <p className="text-lg font-semibold text-slate-900">{lab.name}</p>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">
              {lab.description}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {lab._count.models} model{lab._count.models === 1 ? "" : "s"}
              {lab.foundedYear ? ` · founded ${lab.foundedYear}` : ""}
              {lab.headquarters ? ` · ${lab.headquarters}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
