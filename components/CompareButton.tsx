"use client";

import { useEffect, useState } from "react";
import { COMPARE_EVENT, readCompareList, toggleCompare } from "@/lib/compare";

/** Add / remove a model from the compare list (stored in localStorage). */
export default function CompareButton({ slug }: { slug: string }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setAdded(readCompareList().includes(slug));
    const onChange = () => setAdded(readCompareList().includes(slug));
    window.addEventListener(COMPARE_EVENT, onChange);
    return () => window.removeEventListener(COMPARE_EVENT, onChange);
  }, [slug]);

  return (
    <button
      type="button"
      onClick={() => {
        const next = toggleCompare(slug);
        setAdded(next.includes(slug));
      }}
      className={
        added
          ? "rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          : "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
      }
    >
      {added ? "✓ In comparison" : "+ Compare"}
    </button>
  );
}
