"use client";

import { useState } from "react";
import { useStash } from "@/store/stash";
import { useProfiles } from "@/store/profiles";
import { PRESET_TEAS } from "@/lib/teas";
import { teaNames } from "@/lib/i18n";
import { useT } from "@/store/useT";

export default function StashPage() {
  const { t, lang } = useT();
  const items = useStash((s) => s.items);
  const hydrated = useStash((s) => s.hydrated);
  const custom = useProfiles((s) => s.custom);
  const [adding, setAdding] = useState(false);
  const [teaId, setTeaId] = useState("");
  const [grams, setGrams] = useState(50);
  const [perSession, setPerSession] = useState(5);

  const allTeas = [...custom, ...PRESET_TEAS];
  const unstashed = allTeas.filter(
    (t) => !items.some((i) => i.teaId === t.id),
  );

  const add = () => {
    const tea = allTeas.find((t) => t.id === teaId);
    if (!tea) return;
    useStash.getState().save({
      teaId: tea.id,
      teaName: tea.name,
      liquorColor: tea.liquorColor,
      gramsRemaining: grams,
      gramsPerSession: perSession,
    });
    setAdding(false);
    setTeaId("");
  };

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t.stashEyebrow}
          </p>
          <h1 className="font-display mt-1 text-3xl font-medium">
            {t.stashTitle}
          </h1>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-muted"
        >
          {adding ? t.close : t.addTea}
        </button>
      </header>

      {adding && (
        <div className="mb-6 space-y-3 rounded-2xl border border-line bg-surface p-4">
          <select
            value={teaId}
            onChange={(e) => setTeaId(e.target.value)}
            aria-label="Tea"
            className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm focus:border-muted focus:outline-none"
          >
            <option value="">{t.chooseTea}</option>
            {unstashed.map((tea) => (
              <option key={tea.id} value={tea.id}>
                {teaNames(tea, lang).primary}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-muted">
              {t.gramsOnHand}
              <input
                type="number"
                min={1}
                value={grams}
                onChange={(e) => setGrams(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-ink focus:border-muted focus:outline-none"
              />
            </label>
            <label className="text-xs font-semibold text-muted">
              {t.gramsPerSession}
              <input
                type="number"
                min={1}
                step={0.5}
                value={perSession}
                onChange={(e) => setPerSession(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-ink focus:border-muted focus:outline-none"
              />
            </label>
          </div>
          <button
            onClick={add}
            disabled={!teaId}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-bg disabled:opacity-40"
          >
            {t.addToStash}
          </button>
        </div>
      )}

      {hydrated && items.length === 0 && !adding && (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="text-sm text-muted">{t.stashEmpty}</p>
        </div>
      )}

      <ul className="space-y-2.5">
        {items.map((item) => {
          const sessionsLeft =
            item.gramsPerSession > 0
              ? Math.floor(item.gramsRemaining / item.gramsPerSession)
              : 0;
          const low = sessionsLeft <= 3;
          return (
            <li
              key={item.teaId}
              className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4"
            >
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: item.liquorColor }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-[15px] font-medium">
                  {item.teaName}
                </p>
                <p className={`text-xs ${low ? "font-semibold text-amber-700 dark:text-amber-500" : "text-muted"}`}>
                  {t.stashMeta(item.gramsRemaining, sessionsLeft)}
                  {low ? t.runningLow : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() =>
                    useStash.getState().save({
                      ...item,
                      gramsRemaining: item.gramsRemaining + 25,
                    })
                  }
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
                >
                  +25 g
                </button>
                <button
                  onClick={() => useStash.getState().remove(item.teaId)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-red-700"
                >
                  {t.remove}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
