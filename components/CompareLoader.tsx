"use client";

import { useEffect } from "react";
import { readCompareList } from "@/lib/compare";

/**
 * On /compare with no ?models= param, restore the compare list from
 * localStorage and navigate to the shareable URL.
 */
export default function CompareLoader() {
  useEffect(() => {
    const slugs = readCompareList();
    if (slugs.length > 0) {
      window.location.replace(`/compare?models=${slugs.join(",")}`);
    }
  }, []);

  return (
    <p className="text-sm text-slate-500">
      Loading your comparison… If nothing loads, pick models from the{" "}
      <a href="/models" className="text-indigo-600 hover:underline">
        browse page
      </a>{" "}
      and add them with “+ Compare”.
    </p>
  );
}
