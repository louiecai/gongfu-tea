import type { StashItem, TeaProfile } from "./types";
import { PRESET_TEAS } from "./teas";

/** Grams of leaf for a given tea ratio and vessel size, rounded to 0.1 g. */
export function leafGrams(ratioGramsPer100ml: number, vesselMl: number): number {
  return Math.round((ratioGramsPer100ml * vesselMl) / 10) / 10;
}

/** Stash items with 3 sessions' worth of leaf or less remaining — same rule the stash page uses. */
export function lowStashCount(
  items: StashItem[],
  custom: TeaProfile[],
  vesselMl: number,
): number {
  return items.filter((item) => {
    const tea = PRESET_TEAS.find((t) => t.id === item.teaId) ?? custom.find((t) => t.id === item.teaId);
    const perSession = tea ? leafGrams(tea.ratioGramsPer100ml, vesselMl) : 0;
    const sessionsLeft = perSession > 0 ? Math.floor(item.gramsRemaining / perSession) : 0;
    return sessionsLeft <= 3;
  }).length;
}

// ponytail: flat western-style schedule (3 longer steeps) regardless of tea
// category. Delicate greens/whites will over-steep at 4-5 min — tune per
// category if that turns out to matter in practice.
const WESTERN_STEEPS_SEC = [180, 240, 300];

/** A fewer/longer steep schedule for western-style brewing, in seconds. */
export function westernSchedule(): number[] {
  return WESTERN_STEEPS_SEC;
}
