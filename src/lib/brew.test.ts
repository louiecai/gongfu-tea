import { describe, expect, it } from "vitest";
import { leafGrams } from "./brew";

describe("leafGrams", () => {
  it("scales a tea's 100 ml ratio to the vessel size", () => {
    expect(leafGrams(3, 100)).toBe(3);
    expect(leafGrams(3, 150)).toBe(4.5);
  });

  it("rounds to one decimal place", () => {
    expect(leafGrams(5, 110)).toBe(5.5);
    expect(leafGrams(3.3, 133)).toBeCloseTo(4.4, 1);
  });

  it("handles a zero vessel without throwing", () => {
    expect(leafGrams(5, 0)).toBe(0);
  });
});
