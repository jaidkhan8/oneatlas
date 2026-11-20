export const COMPARE_KEY = "oneatlas:compare";
export const COMPARE_MAX = 4;
export const COMPARE_EVENT = "oneatlas:compare-changed";

export function readCompareList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMPARE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function writeCompareList(slugs: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMPARE_KEY, JSON.stringify(slugs));
  window.dispatchEvent(new Event(COMPARE_EVENT));
}

/** Toggle a model in the compare list. Returns the new list. */
export function toggleCompare(slug: string): string[] {
  const current = readCompareList();
  let next: string[];
  if (current.includes(slug)) {
    next = current.filter((s) => s !== slug);
  } else if (current.length >= COMPARE_MAX) {
    // Replace the oldest entry so the list never exceeds the max.
    next = [...current.slice(1), slug];
  } else {
    next = [...current, slug];
  }
  writeCompareList(next);
  return next;
}
