"use client";

import { useState } from "react";
import Link from "next/link";
import { useLog } from "@/store/log";
import { useProfiles, findTea } from "@/store/profiles";
import { useSession } from "@/store/session";
import { dateLocale, displayTeaName, type Lang } from "@/lib/i18n";
import { formatMs } from "@/lib/timer";
import { useT } from "@/store/useT";

function formatDate(ts: number, lang: Lang): string {
  return new Date(ts).toLocaleDateString(dateLocale(lang), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LogPage() {
  const sessions = useLog((s) => s.sessions);
  const hydrated = useLog((s) => s.hydrated);
  const custom = useProfiles((s) => s.custom);
  const activeLogId = useSession((s) => s.logId);
  const activeFinished = useSession((s) => s.finished);
  const { t, lang } = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);
  const [gramsUsed, setGramsUsed] = useState(0);
  const [steepsCompleted, setSteepsCompleted] = useState(0);
  const [tags, setTags] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const startEdit = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    setEditingId(id);
    setNote(s?.note ?? "");
    setRating(s?.rating ?? 0);
    setGramsUsed(s?.gramsUsed ?? 0);
    setSteepsCompleted(s?.steepsCompleted ?? 0);
    setTags((s?.tags ?? []).join(", "));
  };

  const saveEdit = () => {
    if (editingId) {
      useLog.getState().update(editingId, {
        note: note.trim() || undefined,
        rating: rating || undefined,
        gramsUsed: gramsUsed || undefined,
        steepsCompleted,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
    }
    setEditingId(null);
  };

  const toggleFavorite = (id: string, current: boolean | undefined) =>
    useLog.getState().update(id, { favorite: !current });

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {t.logEyebrow}
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium">
          {t.logTitle}
        </h1>
      </header>

      {hydrated && sessions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="text-sm text-muted">{t.logEmpty}</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-bg"
          >
            {t.pickTea}
          </Link>
        </div>
      )}

      <ul className="space-y-2.5">
        {sessions.map((s) => {
          const tea = findTea(s.teaId, custom);
          return (
            <li
              key={s.id}
              className="rounded-2xl border border-line bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: s.liquorColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display truncate text-[15px] font-medium">
                    {displayTeaName(s.teaName, tea, lang)}
                    {s.tags && s.tags.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-muted">
                        {s.tags.map((tag) => `#${tag}`).join(" ")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(s.startedAt, lang)} ·{" "}
                    {t.logMeta(s.steepsCompleted, s.totalSteeps)}
                    {s.tempC ? ` · ${s.tempC}°C` : ""}
                    {s.gramsUsed ? ` · ${t.grams(s.gramsUsed)}` : ""}
                    {s.totalBrewMs ? ` · ${t.totalBrewed(formatMs(s.totalBrewMs))}` : ""}
                  </p>
                  {s.steeps && s.steeps.length > 0 && (
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === s.id ? null : s.id)
                      }
                      className="mt-1 text-[11px] font-semibold text-muted hover:text-ink"
                    >
                      {expandedId === s.id ? "▴" : "▾"} {t.steepsToggle}
                    </button>
                  )}
                  {expandedId === s.id && s.steeps && (
                    <ul
                      className="mt-1.5 space-y-0.5 border-l-2 pl-3 text-xs text-muted"
                      style={{ borderColor: s.liquorColor }}
                    >
                      {s.steeps.map((rec) => (
                        <li key={rec.steepIndex}>
                          {t.steepRow(
                            rec.steepIndex + 1,
                            new Date(rec.startedAt).toLocaleTimeString(
                              dateLocale(lang),
                              { hour: "numeric", minute: "2-digit" },
                            ),
                            formatMs(rec.durationMs),
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {activeLogId === s.id && !activeFinished && (
                  <Link
                    href={`/session?tea=${s.teaId}`}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                    style={{ background: s.liquorColor }}
                  >
                    {t.resumeSession}
                  </Link>
                )}
                <button
                  onClick={() => toggleFavorite(s.id, s.favorite)}
                  aria-pressed={!!s.favorite}
                  aria-label={t.favoriteLabel}
                  className={`shrink-0 text-lg leading-none ${s.favorite ? "" : "opacity-25 grayscale"}`}
                >
                  ★
                </button>
                {s.rating ? (
                  <span className="shrink-0 text-sm" aria-label={`${s.rating} stars`}>
                    {"★".repeat(s.rating)}
                    <span className="opacity-25">
                      {"★".repeat(5 - s.rating)}
                    </span>
                  </span>
                ) : null}
                <button
                  onClick={() =>
                    editingId === s.id ? setEditingId(null) : startEdit(s.id)
                  }
                  className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
                >
                  {editingId === s.id ? t.close : s.note ? t.editNote : t.addNote}
                </button>
              </div>

              {s.note && editingId !== s.id && (
                <p className="mt-2.5 border-l-2 pl-3 text-sm text-muted" style={{ borderColor: s.liquorColor }}>
                  {s.note}
                </p>
              )}

              {editingId === s.id && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-1.5" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        role="radio"
                        aria-checked={rating === n}
                        onClick={() => setRating(n)}
                        className={`text-xl ${n <= rating ? "" : "opacity-25 grayscale"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-semibold text-muted">
                      {t.gramsUsedLabel}
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={gramsUsed}
                        onChange={(e) => setGramsUsed(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-ink focus:border-muted focus:outline-none"
                      />
                    </label>
                    <label className="text-xs font-semibold text-muted">
                      {t.steepsCompletedLabel}
                      <input
                        type="number"
                        min={0}
                        max={s.totalSteeps}
                        value={steepsCompleted}
                        onChange={(e) => setSteepsCompleted(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-ink focus:border-muted focus:outline-none"
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold text-muted">
                    {t.tagsLabel}
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder={t.tagsPlaceholder}
                      className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-muted focus:outline-none"
                    />
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder={t.shortNotePlaceholder}
                    className="w-full rounded-xl border border-line bg-bg p-3 text-sm placeholder:text-muted focus:border-muted focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-bg"
                    >
                      {t.save}
                    </button>
                    <button
                      onClick={() => {
                        useLog.getState().remove(s.id);
                        setEditingId(null);
                      }}
                      className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted hover:text-red-700"
                    >
                      {t.deleteSession}
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
