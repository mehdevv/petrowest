const DATA_URL =
  "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/data.json";

export interface CarBrandEntry {
  name: string;
  slug: string;
  thumb: string;
  optimized: string;
}

let _cache: CarBrandEntry[] | null = null;
let _fetching: Promise<CarBrandEntry[]> | null = null;

export async function getCarBrands(): Promise<CarBrandEntry[]> {
  if (_cache) return _cache;
  if (_fetching) return _fetching;

  _fetching = fetch(DATA_URL)
    .then((r) => r.json())
    .then((data: any[]) => {
      _cache = data.map((d) => ({
        name: d.name,
        slug: d.slug,
        thumb: d.image?.thumb ?? "",
        optimized: d.image?.optimized ?? "",
      }));
      return _cache;
    })
    .catch(() => {
      _fetching = null;
      return [] as CarBrandEntry[];
    });

  return _fetching;
}

/**
 * Simple fuzzy scoring: higher = better match.
 * Returns -1 for no match.
 */
function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (t === q) return 10000;
  if (t.startsWith(q)) return 5000 + (1000 - t.length);
  if (t.includes(q)) return 3000 + (1000 - t.length);

  // Character-order subsequence match with gap penalty
  let qi = 0;
  let score = 0;
  let lastMatchIdx = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 100;
      // Bonus for consecutive matches
      if (lastMatchIdx === ti - 1) score += 50;
      // Bonus for matching at word boundaries
      if (ti === 0 || t[ti - 1] === " " || t[ti - 1] === "-") score += 30;
      lastMatchIdx = ti;
      qi++;
    }
  }

  if (qi < q.length) return -1; // not all chars matched
  return score;
}

export function searchCarBrands(
  query: string,
  brands: CarBrandEntry[],
  limit = 10
): CarBrandEntry[] {
  if (!query || query.length < 1) return brands.slice(0, limit);

  const scored = brands
    .map((b) => ({ brand: b, score: fuzzyScore(query, b.name) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.brand);
}
