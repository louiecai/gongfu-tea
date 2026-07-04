/** Grams of leaf for a given tea ratio and vessel size, rounded to 0.1 g. */
export function leafGrams(ratioGramsPer100ml: number, vesselMl: number): number {
  return Math.round((ratioGramsPer100ml * vesselMl) / 10) / 10;
}
