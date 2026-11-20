import Link from "next/link";
import CompareButton from "./CompareButton";
import { formatContext, formatPrice } from "@/lib/format";
import type { ModelWithLab } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  chat: "Chat",
  reasoning: "Reasoning",
  multimodal: "Multimodal",
  embedding: "Embedding",
  image: "Image",
  audio: "Audio",
  code: "Code",
};

export default function ModelCard({ model }: { model: ModelWithLab }) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            href={`/models/${model.slug}`}
            className="text-lg font-semibold text-slate-900 hover:text-indigo-700"
          >
            {model.name}
          </Link>
          <p className="text-sm text-slate-500">
            <Link href={`/labs/${model.lab.slug}`} className="hover:underline">
              {model.lab.name}
            </Link>
            {" · "}
            {TYPE_LABELS[model.modelType] ?? model.modelType}
          </p>
        </div>
        {model.status !== "active" && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {model.status}
          </span>
        )}
      </div>

      {model.description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
          {model.description}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 px-1 py-2">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Input / 1M
          </dt>
          <dd className="mt-0.5 text-sm font-semibold">
            {formatPrice(model.inputPricePer1M)}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-1 py-2">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Output / 1M
          </dt>
          <dd className="mt-0.5 text-sm font-semibold">
            {formatPrice(model.outputPricePer1M)}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-1 py-2">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Context
          </dt>
          <dd className="mt-0.5 text-sm font-semibold">
            {formatContext(model.contextWindow)}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {model.openWeights && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Open weights
          </span>
        )}
        {model.capabilities.slice(0, 3).map((c) => (
          <span
            key={c}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <Link
          href={`/models/${model.slug}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Details →
        </Link>
        <CompareButton slug={model.slug} />
      </div>
    </article>
  );
}
