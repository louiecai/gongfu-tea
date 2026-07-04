import { describe, expect, it } from "vitest";
import {
  idleTimer,
  isExpired,
  remainingMs,
  scaledSteepMs,
  startTimer,
} from "./timer";

describe("scaledSteepMs", () => {
  it("applies the strength multiplier and converts to ms", () => {
    expect(scaledSteepMs(20, 1)).toBe(20_000);
    expect(scaledSteepMs(20, 1.5)).toBe(30_000);
  });

  it("never goes below 1 second, even at the lightest strength", () => {
    expect(scaledSteepMs(1, 0.1)).toBe(1000);
  });
});

describe("remainingMs / isExpired", () => {
  it("counts down from a running timer using timestamps, not ticks", () => {
    const now = 1_000_000;
    const t = startTimer(idleTimer(10_000), now);
    expect(remainingMs(t, now + 4_000)).toBe(6_000);
    expect(isExpired(t, now + 4_000)).toBe(false);
    expect(isExpired(t, now + 10_000)).toBe(true);
  });

  it("reports zero once past the deadline", () => {
    const now = 0;
    const t = startTimer(idleTimer(5_000), now);
    expect(remainingMs(t, now + 9_999_999)).toBe(0);
  });
});
