"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { findTea, useProfiles } from "@/store/profiles";
import { useLog } from "@/store/log";
import { TeaIcon } from "@/components/TeaIcon";
import { formatSeconds } from "@/lib/timer";
import { categoryLabel, dateLocale, teaNames } from "@/lib/i18n";
import { useT } from "@/store/useT";

function formatShortDate(ts: number, lang: "en" | "zh"): string {
  return new Date(ts).toLocaleDateString(dateLocale(lang), {
    month: "short",
    day: "numeric",
  });
}

function TeaDetailsInner() {
  const id = useSearchParams().get("id") ?? "";
  const custom = useProfiles((s) => s.custom);
  const hydrated = useProfiles((s) => s.hydrated);
  const sessions = useLog((s) => s.sessions);
  const { t, lang } = useT();
  const tea = findTea(id, custom);

  const history = useMemo(() => {
    const brews = sessions.filter((s) => s.teaId === id);
    if (brews.length === 0) return null;
    const rated = brews.filter((s) => s.rating);
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length
        : null;
    // `sessions` is newest-first, so scanning in order and only replacing on
    // a strictly higher rating naturally ties-break to the newest of equals.
    const bestBrew = rated.reduce<(typeof rated)[number] | null>(
      (top, s) => (!top || (s.rating ?? 0) > (top.rating ?? 0) ? s : top),
      null,
    );
    return {
      count: brews.length,
      lastBrewedAt: brews[0].startedAt,
      avgRating,
      bestBrew,
    };
  }, [sessions, id]);

  if (!hydrated) return null;
  if (!tea) {
    return (
      <div className="pt-20 text-center">
        <p className="text-muted">{t.teaNotFound}</p>
        <Link href="/" className="mt-3 inline-block font-semibold underline">
          {t.backToTeas}
        </Link>
      </div>
    );
  }

  const names = teaNames(tea, lang);

  return (
    <div className="mx-auto max-w-sm pt-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {t.detailsEyebrow}
      </p>
      <span
        className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          color: tea.liquorColor,
          background: `color-mix(in srgb, ${tea.liquorColor} 16%, transparent)`,
        }}
      >
        <TeaIcon icon={tea.icon} className="h-10 w-10" />
      </span>
      <h1 className="font-display mt-4 text-3xl font-medium">
        {names.primary}
      </h1>
      {names.secondary && <p className="mt-1 text-muted">{names.secondary}</p>}
      <p className="mt-3 text-sm text-muted">
        {categoryLabel(tea.category, lang)} · {tea.tempC}°C ·{" "}
        {tea.ratioGramsPer100ml} g/100 ml
      </p>
      <p className="mt-1.5 text-sm text-muted">
        {t.importMeta(tea.steepsSec.length)}
        {tea.steepsSec.map((s) => formatSeconds(s)).join(" → ")}
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-4 text-left text-sm">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {t.yourHistory}
        </p>
        {history ? (
          <div className="space-y-1 text-muted">
            <p>
              {t.historyBrewCount(history.count)} ·{" "}
              {t.historyLastBrewed(formatShortDate(history.lastBrewedAt, lang))}
            </p>
            {history.avgRating != null && (
              <p>{t.historyAvgRating(history.avgRating.toFixed(1))}</p>
            )}
            {history.bestBrew?.gramsUsed != null && history.bestBrew.tempC != null && (
              <p>
                {t.historyBestBrew(
                  history.bestBrew.gramsUsed.toString(),
                  history.bestBrew.tempC,
                )}
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted">{t.noHistoryYet}</p>
        )}
      </div>

      <div className="mt-7 flex justify-center gap-3">
        <Link
          href={`/session?tea=${tea.id}`}
          className="rounded-full px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
          style={{ background: tea.liquorColor }}
        >
          {t.brew}
        </Link>
        <Link
          href={`/profiles/new?clone=${tea.id}`}
          className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-muted hover:text-ink"
        >
          {t.cloneAndCustomize}
        </Link>
      </div>
    </div>
  );
}

export default function TeaDetailsPage() {
  return (
    <Suspense fallback={null}>
      <TeaDetailsInner />
    </Suspense>
  );
}
