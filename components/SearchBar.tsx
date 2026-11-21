"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type SearchResult = {
  models: { slug: string; name: string; lab: string; modelType: string }[];
  labs: { slug: string; name: string }[];
  providers: { slug: string; name: string }[];
};

/** Global search: queries /api/search and shows a dropdown of matches. */
export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      abortRef.current?.abort();
      setResults(null);
      setOpen(false);
      setLoading(false);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      // Cancel any in-flight search so a slow earlier response can never
      // overwrite newer results.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          setResults(await res.json());
          setOpen(true);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          // Search is best-effort; a failed request just shows nothing.
        }
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hasResults =
    results &&
    (results.models.length > 0 ||
      results.labs.length > 0 ||
      results.providers.length > 0);

  return (
    <div ref={boxRef} className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (hasResults) setOpen(true);
        }}
        type="search"
        placeholder="Search models, labs, providers…"
        aria-label="Search models, labs and providers"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading && (
            <p className="px-3 py-2 text-sm text-slate-500">Searching…</p>
          )}
          {!loading && !hasResults && (
            <p className="px-3 py-2 text-sm text-slate-500">
              No matches for “{query.trim()}”.
            </p>
          )}
          {results?.models.map((m) => (
            <Link
              key={m.slug}
              href={`/models/${m.slug}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{m.name}</span>{" "}
              <span className="text-slate-500">
                · {m.lab} · {m.modelType}
              </span>
            </Link>
          ))}
          {results?.labs.map((l) => (
            <Link
              key={`lab-${l.slug}`}
              href={`/labs/${l.slug}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{l.name}</span>{" "}
              <span className="text-slate-500">· Lab</span>
            </Link>
          ))}
          {results?.providers.map((p) => (
            <Link
              key={`prov-${p.slug}`}
              href={`/providers/${p.slug}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{p.name}</span>{" "}
              <span className="text-slate-500">· Provider</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
