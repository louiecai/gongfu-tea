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
  description?: string;
  custom?: boolean;
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
}

export interface StashItem {
  teaId: string;
  teaName: string;
  liquorColor: string;
  gramsRemaining: number;
  gramsPerSession: number;
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
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  notifications: false,
  vibration: true,
  keepScreenOn: true,
  strength: 1,
  theme: "system",
  language: "en",
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
