"use client";

type Option = { value: string; label: string };

/**
 * Sort dropdown for the models page. Navigates to the models page with the
 * chosen sort, keeping the current filters. The href is built here in the
 * client component from plain query-param data — Next.js does not allow a
 * server component to pass a function down to a client component.
 */
export default function SortSelect({
  value,
  options,
  baseParams,
}: {
  value: string;
  options: Option[];
  baseParams: Record<string, string | undefined>;
}) {
  function buildHref(sort: string): string {
    const params = new URLSearchParams();
    const merged = { ...baseParams, sort, page: undefined };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "") params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/models?${qs}` : "/models";
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      Sort by
      <select
        value={value}
        onChange={(e) => {
          window.location.href = buildHref(e.target.value);
        }}
        className="rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-indigo-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
