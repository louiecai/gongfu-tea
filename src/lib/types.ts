import type { TimerState } from "./timer";

export type TeaCategory =
  | "green"
  | "white"
  | "yellow"
  | "oolong-light"
  | "oolong-dark"
  | "black"
  | "puer-sheng"
  | "puer-shou"
  | "heicha"
  | "herbal";

export type TeaIconKey =
  | "leaf"
  | "bud"
  | "twist"
  | "pearl"
  | "strip"
  | "cake"
  | "brick"
  | "flower"
  | "needle";

export interface TeaProfile {
  id: string;
  name: string;
  chineseName?: string;
  category: TeaCategory;
  /** Hex color of the brewed liquor; drives ring + card accents. */
  liquorColor: string;
  icon: TeaIconKey;
  tempC: number;
  /** Grams of leaf per 100 ml of water. */
  ratioGramsPer100ml: number;
  /** Seconds per steep, in order. */
  steepsSec: number[];
  autoAdvance: boolean;
  /** A short flash steep before steep 1, to wake the leaves — doesn't count
   * toward steeps/log stats. On by default for pu-erh and heicha presets. */
  hasRinse?: boolean;
  description?: string;
  custom?: boolean;
}

/** One pour: when it started and how long it actually ran. */
export interface SteepRecord {
  steepIndex: number;
  startedAt: number;
  durationMs: number;
}

export interface BrewSession {
  id: string;
  teaId: string;
  teaName: string;
  liquorColor: string;
  startedAt: number;
  steepsCompleted: number;
  totalSteeps: number;
  rating?: number;
  note?: string;
  gramsUsed?: number;
  tempC?: number;
  /** Cumulative time actually spent steeping, in ms. */
  totalBrewMs?: number;
  favorite?: boolean;
  tags?: string[];
  steeps?: SteepRecord[];
}

/**
 * Snapshot of a live, unfinished brew session — persisted so quitting the
 * app (reload, closed tab) doesn't lose your place. Keyed by `logId`, the
 * same id as the `BrewSession` log row it's building up.
 */
export interface ActiveSession {
  logId: string;
  teaId: string;
  steepIndex: number;
  steepDurations: number[];
  steepsCompleted: number;
  totalBrewMs: number;
  timer: TimerState;
  justFinishedSteep: number | null;
  steeps: SteepRecord[];
  rinsing: boolean;
}

export interface StashItem {
  teaId: string;
  teaName: string;
  liquorColor: string;
  gramsRemaining: number;
  /** @deprecated grams/session is now derived from the tea's ratio + vessel size. */
  gramsPerSession?: number;
}

export interface Settings {
  sound: boolean;
  notifications: boolean;
  vibration: boolean;
  keepScreenOn: boolean;
  /** Multiplier applied to every steep duration (0.7–1.4). */
  strength: number;
  theme: "system" | "light" | "dark";
  language: "en" | "zh";
  /** Water volume per brew, in ml — drives leaf grams via each tea's ratio. */
  vesselMl: number;
  favorites: string[];
  /** Named pots/gaiwans for quick vessel-size switching. */
  vesselProfiles: { id: string; name: string; ml: number }[];
  chimeStyle: "bell" | "wood" | "bright";
  /** Gongfu: many short steeps, per each tea's own schedule. Western: a few longer ones. */
  brewStyle: "gongfu" | "western";
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  notifications: false,
  vibration: true,
  keepScreenOn: true,
  strength: 1,
  theme: "system",
  language: "en",
  vesselMl: 100,
  favorites: [],
  vesselProfiles: [
    { id: "gaiwan", name: "Gaiwan", ml: 100 },
    { id: "pot", name: "Small pot", ml: 150 },
  ],
  chimeStyle: "bell",
  brewStyle: "gongfu",
};

export const CATEGORY_LABELS: Record<TeaCategory, string> = {
  green: "Green",
  white: "White",
  yellow: "Yellow",
  "oolong-light": "Light Oolong",
  "oolong-dark": "Dark Oolong",
  black: "Black / Red",
  "puer-sheng": "Sheng Pu-erh",
  "puer-shou": "Shou Pu-erh",
  heicha: "Heicha",
  herbal: "Herbal",
};
