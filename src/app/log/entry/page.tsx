"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLog } from "@/store/log";
import { useProfiles, findTea } from "@/store/profiles";
import { useActiveSessions } from "@/store/activeSessions";
import { dateLocale, displayTeaName, teaNames, type Lang } from "@/lib/i18n";
import { formatMs } from "@/lib/timer";
import type { BrewSession } from "@/lib/types";
import { TeaIcon } from "@/components/TeaIcon";
import { useT } from "@/store/useT";

function formatDateTime(ts: number, lang: Lang): string {
  return new Date(ts).toLocaleDateString(dateLocale(lang), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function LogEntryForm({ session }: { session: BrewSession }) {
  const router = useRouter();
  const custom = useProfiles((s) => s.custom);
  const activeSessions = useActiveSessions((s) => s.sessions);
  const { t, lang } = useT();

  const [note, setNote] = useState(session.note ?? "");
  const [rating, setRating] = useState(session.rating ?? 0);
  const [gramsUsed, setGramsUsed] = useState(session.gramsUsed ?? 0);
  const [steepsCompleted, setSteepsCompleted] = useState(
    session.steepsCompleted,
  );
  const [tags, setTags] = useState((session.tags ?? []).join(", "));
  const [saved, setSaved] = useState(false);

  const tea = findTea(session.teaId, custom);
  const names = tea ? teaNames(tea, lang) : null;
  const isActive = activeSessions.some((a) => a.logId === session.id);

  const save = () => {
    useLog.getState().update(session.id, {
      note: note.trim() || undefined,
      rating: rating || undefined,
      gramsUsed: gramsUsed || undefined,
      steepsCompleted,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setSaved(true);
  };

  const remove = () => {
    if (!window.confirm(t.deleteSessionConfirm)) return;
    useLog.getState().remove(session.id);
    useActiveSessions.getState().remove(session.id);
    router.push("/log");
  };

  return (
    <div className="mx-auto max-w-sm">
      <Link
        href="/log"
        className="text-sm font-semibold text-muted hover:text-ink"
      >
        {t.back}
      </Link>

      <header className="mt-3 mb-6 flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{
            color: session.liquorColor,
            background: `color-mix(in srgb, ${session.liquorColor} 16%, transparent)`,
          }}
        >
          <TeaIcon icon={tea?.icon ?? "leaf"} className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t.logEntryEyebrow}
          </p>
          <h1 className="font-display truncate text-2xl font-medium">
            {displayTeaName(session.teaName, tea, lang)}
          </h1>
          {names?.secondary && (
            <p className="text-sm text-muted">{names.secondary}</p>
          )}
        </div>
      </header>

      <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        <p>{formatDateTime(session.startedAt, lang)}</p>
        <p className="mt-1">
          {t.logMeta(session.steepsCompleted, session.totalSteeps)}
          {session.tempC ? ` · ${session.tempC}°C` : ""}
          {session.gramsUsed ? ` · ${t.grams(session.gramsUsed)}` : ""}
          {session.totalBrewMs
            ? ` · ${t.totalBrewed(formatMs(session.totalBrewMs))}`
            : ""}
        </p>
      </div>

      {session.steeps && session.steeps.length > 0 && (
        <ul
          className="mt-3 space-y-1 border-l-2 pl-3 text-xs text-muted"
          style={{ borderColor: session.liquorColor }}
        >
          {session.steeps.map((rec) => (
            <li key={rec.steepIndex}>
              {t.steepRow(
                rec.steepIndex + 1,
                new Date(rec.startedAt).toLocaleTimeString(dateLocale(lang), {
                  hour: "numeric",
                  minute: "2-digit",
                }),
                formatMs(rec.durationMs),
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        {isActive ? (
          <Link
            href={`/session?tea=${session.teaId}`}
            className="flex-1 rounded-full px-4 py-2.5 text-center text-sm font-bold text-white"
            style={{ background: session.liquorColor }}
          >
            {t.resumeSession}
          </Link>
        ) : (
          <Link
            href={`/session?tea=${session.teaId}${session.gramsUsed ? `&grams=${session.gramsUsed}` : ""}`}
            className="flex-1 rounded-full border border-line px-4 py-2.5 text-center text-sm font-semibold text-muted hover:text-ink"
          >
            {t.brewAgain}
          </Link>
        )}
        <button
          onClick={() =>
            useLog.getState().update(session.id, { favorite: !session.favorite })
          }
          aria-pressed={!!session.favorite}
          aria-label={t.favoriteLabel}
          className={`shrink-0 rounded-full border border-line px-4 py-2.5 text-lg leading-none ${
            session.favorite ? "" : "opacity-25 grayscale"
          }`}
        >
          ★
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <div>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={rating === n}
                onClick={() => setRating(n === rating ? 0 : n)}
                className={`text-2xl ${n <= rating ? "" : "opacity-25 grayscale"}`}
              >
                ★
              </button>
            ))}
          </div>
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
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-muted focus:outline-none"
            />
          </label>
          <label className="text-xs font-semibold text-muted">
            {t.steepsCompletedLabel}
            <input
              type="number"
              min={0}
              max={session.totalSteeps}
              value={steepsCompleted}
              onChange={(e) => setSteepsCompleted(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-muted focus:outline-none"
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
            className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-muted focus:outline-none"
          />
        </label>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          placeholder={t.notePlaceholder}
          aria-label={t.shortNotePlaceholder}
          className="w-full rounded-xl border border-line bg-surface p-3 text-sm placeholder:text-muted focus:border-muted focus:outline-none"
        />

        <div className="flex gap-2 pt-1">
          <button
            onClick={save}
            disabled={saved}
            className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saved ? t.saved : t.save}
          </button>
          <button
            onClick={remove}
            className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-muted hover:text-red-700"
          >
            {t.deleteSession}
          </button>
        </div>
      </div>
    </div>
  );
}

function LogEntryInner() {
  const id = useSearchParams().get("id") ?? "";
  const hydrated = useLog((s) => s.hydrated);
  const sessions = useLog((s) => s.sessions);
  const { t } = useT();

  if (!hydrated) return null;

  const session = sessions.find((s) => s.id === id);
  if (!session) {
    return (
      <div className="pt-20 text-center">
        <p className="text-muted">{t.sessionNotFound}</p>
        <Link href="/log" className="mt-3 inline-block font-semibold underline">
          {t.backToLog}
        </Link>
      </div>
    );
  }

  return <LogEntryForm key={session.id} session={session} />;
}

export default function LogEntryPage() {
  return (
    <Suspense fallback={null}>
      <LogEntryInner />
    </Suspense>
  );
}
