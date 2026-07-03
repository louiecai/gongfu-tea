import type { TeaCategory, TeaIconKey, TeaProfile } from "./types";
import { CATEGORY_LABELS } from "./types";

/**
 * Encode/decode a custom profile into a URL-safe string so profiles can be
 * shared as links with no backend.
 */

function toBase64Url(s: string): string {
  const b64 =
    typeof window !== "undefined"
      ? window.btoa(unescape(encodeURIComponent(s)))
      : Buffer.from(s, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return typeof window !== "undefined"
    ? decodeURIComponent(escape(window.atob(b64)))
    : Buffer.from(b64, "base64").toString("utf8");
}

export function encodeProfile(p: TeaProfile): string {
  const compact = {
    n: p.name,
    cn: p.chineseName,
    c: p.category,
    lc: p.liquorColor,
    i: p.icon,
    t: p.tempC,
    r: p.ratioGramsPer100ml,
    s: p.steepsSec,
    a: p.autoAdvance ? 1 : 0,
    d: p.description,
  };
  return toBase64Url(JSON.stringify(compact));
}

const ICON_KEYS: TeaIconKey[] = [
  "leaf",
  "bud",
  "twist",
  "pearl",
  "strip",
  "cake",
  "brick",
  "flower",
  "needle",
];

export function decodeProfile(encoded: string): TeaProfile | null {
  try {
    const raw = JSON.parse(fromBase64Url(encoded)) as Record<string, unknown>;
    const name = typeof raw.n === "string" ? raw.n.slice(0, 60) : null;
    const category =
      typeof raw.c === "string" && raw.c in CATEGORY_LABELS
        ? (raw.c as TeaCategory)
        : null;
    const steeps = Array.isArray(raw.s)
      ? raw.s
          .filter((x): x is number => typeof x === "number" && isFinite(x))
          .map((x) => Math.min(3600, Math.max(1, Math.round(x))))
      : null;
    if (!name || !category || !steeps || steeps.length === 0) return null;

    return {
      id: `custom-${Date.now().toString(36)}`,
      name,
      chineseName:
        typeof raw.cn === "string" ? raw.cn.slice(0, 30) : undefined,
      category,
      liquorColor:
        typeof raw.lc === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.lc)
          ? raw.lc
          : "#c8a25e",
      icon: ICON_KEYS.includes(raw.i as TeaIconKey)
        ? (raw.i as TeaIconKey)
        : "leaf",
      tempC:
        typeof raw.t === "number" ? Math.min(100, Math.max(40, raw.t)) : 95,
      ratioGramsPer100ml:
        typeof raw.r === "number" ? Math.min(20, Math.max(0.5, raw.r)) : 5,
      steepsSec: steeps.slice(0, 20),
      autoAdvance: raw.a !== 0,
      description:
        typeof raw.d === "string" ? raw.d.slice(0, 200) : undefined,
      custom: true,
    };
  } catch {
    return null;
  }
}
