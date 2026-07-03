"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TeaCategory, TeaIconKey, TeaProfile } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { useProfiles } from "@/store/profiles";
import { TeaIcon } from "./TeaIcon";

const ICONS: TeaIconKey[] = [
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

const SUGGESTED_COLORS = [
  "#c8d96b",
  "#e3d370",
  "#ecdc9a",
  "#cfd66a",
  "#c07a2e",
  "#b85a1b",
  "#d6b545",
  "#6e3a1a",
  "#7c4620",
  "#e9d780",
];

function parseSteeps(text: string): number[] {
  return text
    .split(/[,\s]+/)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 3600)
    .map((n) => Math.round(n));
}

export function ProfileEditor({ initial }: { initial?: TeaProfile }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [chineseName, setChineseName] = useState(initial?.chineseName ?? "");
  const [category, setCategory] = useState<TeaCategory>(
    initial?.category ?? "oolong-light",
  );
  const [color, setColor] = useState(initial?.liquorColor ?? "#c8a25e");
  const [icon, setIcon] = useState<TeaIconKey>(initial?.icon ?? "leaf");
  const [tempC, setTempC] = useState(initial?.tempC ?? 95);
  const [ratio, setRatio] = useState(initial?.ratioGramsPer100ml ?? 5);
  const [steepsText, setSteepsText] = useState(
    initial?.steepsSec.join(", ") ?? "15, 20, 30, 45, 60, 90",
  );
  const [autoAdvance, setAutoAdvance] = useState(initial?.autoAdvance ?? true);
  const [error, setError] = useState<string | null>(null);

  const steeps = parseSteeps(steepsText);

  const save = () => {
    if (!name.trim()) {
      setError("Give the tea a name.");
      return;
    }
    if (steeps.length === 0) {
      setError("Add at least one steep time, in seconds — e.g. 15, 20, 30.");
      return;
    }
    const profile: TeaProfile = {
      id: initial?.id ?? `custom-${Date.now().toString(36)}`,
      name: name.trim(),
      chineseName: chineseName.trim() || undefined,
      category,
      liquorColor: color,
      icon,
      tempC,
      ratioGramsPer100ml: ratio,
      steepsSec: steeps,
      autoAdvance,
      custom: true,
    };
    useProfiles.getState().save(profile);
    router.push("/profiles");
  };

  const field =
    "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted focus:border-muted focus:outline-none";
  const label = "mb-1.5 block text-xs font-semibold text-muted";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tea-name" className={label}>
            Name
          </label>
          <input
            id="tea-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Grandpa’s Tieguanyin"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="tea-cn" className={label}>
            Chinese name <span className="font-normal">(optional)</span>
          </label>
          <input
            id="tea-cn"
            value={chineseName}
            onChange={(e) => setChineseName(e.target.value)}
            placeholder="铁观音"
            className={field}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="tea-cat" className={label}>
            Type
          </label>
          <select
            id="tea-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value as TeaCategory)}
            className={field}
          >
            {Object.entries(CATEGORY_LABELS).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tea-temp" className={label}>
            Water °C
          </label>
          <input
            id="tea-temp"
            type="number"
            min={40}
            max={100}
            value={tempC}
            onChange={(e) => setTempC(Number(e.target.value))}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="tea-ratio" className={label}>
            g / 100 ml
          </label>
          <input
            id="tea-ratio"
            type="number"
            min={0.5}
            max={20}
            step={0.5}
            value={ratio}
            onChange={(e) => setRatio(Number(e.target.value))}
            className={field}
          />
        </div>
      </div>

      <div>
        <label htmlFor="tea-steeps" className={label}>
          Steep times, seconds
        </label>
        <input
          id="tea-steeps"
          value={steepsText}
          onChange={(e) => setSteepsText(e.target.value)}
          placeholder="15, 20, 30, 45, 60, 90"
          inputMode="numeric"
          className={field}
        />
        {steeps.length > 0 && (
          <p className="mt-1.5 text-xs text-muted">
            {steeps.length} steeps: {steeps.map((s) => `${s}s`).join(" → ")}
          </p>
        )}
      </div>

      <div>
        <span className={label}>Liquor color</span>
        <div className="flex flex-wrap items-center gap-2">
          {SUGGESTED_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Use color ${c}`}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                color === c ? "ring-2 ring-ink ring-offset-2 ring-offset-bg" : ""
              }`}
              style={{ background: c }}
            />
          ))}
          <input
            type="color"
            aria-label="Custom color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded-lg border border-line bg-surface"
          />
        </div>
      </div>

      <div>
        <span className={label}>Leaf shape</span>
        <div className="flex flex-wrap gap-2">
          {ICONS.map((key) => (
            <button
              key={key}
              type="button"
              aria-label={`Icon: ${key}`}
              aria-pressed={icon === key}
              onClick={() => setIcon(key)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                icon === key
                  ? "border-ink bg-surface"
                  : "border-line text-muted hover:border-muted"
              }`}
              style={icon === key ? { color } : undefined}
            >
              <TeaIcon icon={key} className="h-6 w-6" />
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={autoAdvance}
          onChange={(e) => setAutoAdvance(e.target.checked)}
          className="h-4 w-4 accent-current"
        />
        Move to the next steep automatically after each pour
      </label>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          onClick={save}
          className="rounded-full px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
          style={{ background: color }}
        >
          Save tea
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
