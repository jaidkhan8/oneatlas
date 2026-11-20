"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COMPARE_EVENT,
  COMPARE_MAX,
  readCompareList,
  writeCompareList,
} from "@/lib/compare";

/** Floating bar showing the compare list; links to /compare. */
export default function CompareTray() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(readCompareList());
    const onChange = () => setSlugs(readCompareList());
    window.addEventListener(COMPARE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(COMPARE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (slugs.length === 0) return null;

  const href = `/compare?models=${slugs.join(",")}`;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
        <span>
          {slugs.length} model{slugs.length > 1 ? "s" : ""} to compare
          <span className="text-slate-400"> (max {COMPARE_MAX})</span>
        </span>
        <Link
          href={href}
          className="rounded-full bg-indigo-600 px-3 py-1 font-medium text-white hover:bg-indigo-500"
        >
          Compare
        </Link>
        <button
          onClick={() => writeCompareList([])}
          className="text-slate-300 hover:text-white"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
