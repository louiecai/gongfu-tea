import { describe, expect, it } from "vitest";
import { displayTeaName, teaNames } from "./i18n";

const longjing = { name: "Longjing", chineseName: "龙井" };
const noChineseName = { name: "Grandpa's Blend" };

describe("teaNames", () => {
  it("puts English first in en mode", () => {
    expect(teaNames(longjing, "en")).toEqual({
      primary: "Longjing",
      secondary: "龙井",
    });
  });

  it("puts Chinese first in zh mode when available", () => {
    expect(teaNames(longjing, "zh")).toEqual({
      primary: "龙井",
      secondary: "Longjing",
    });
  });

  it("falls back to the English name in zh mode when there is no Chinese name", () => {
    expect(teaNames(noChineseName, "zh")).toEqual({
      primary: "Grandpa's Blend",
      secondary: undefined,
    });
  });
});

describe("displayTeaName", () => {
  it("re-derives the name from the live tea, flipping with language", () => {
    expect(displayTeaName("Longjing", longjing, "en")).toBe("Longjing");
    expect(displayTeaName("Longjing", longjing, "zh")).toBe("龙井");
  });

  it("falls back to the stored snapshot when the tea no longer exists", () => {
    // e.g. a stash/log entry whose custom tea profile was later deleted.
    expect(displayTeaName("Deleted Custom Tea", undefined, "zh")).toBe(
      "Deleted Custom Tea",
    );
  });
});
