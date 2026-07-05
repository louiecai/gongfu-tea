"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useLog } from "@/store/log";
import { useProfiles, findTea } from "@/store/profiles";
import { useActiveSessions } from "@/store/activeSessions";
import { dateLocale, displayTeaName, teaNames, type Lang } from "@/lib/i18n";
import { formatMs } from "@/lib/timer";
import type { ActiveSession, BrewSession } from "@/lib/types";
import { TeaIcon } from "@/components/TeaIcon";
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
  const activeSessions = useActiveSessions((s) => s.sessions);
  const { t, lang } = useT();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "rating" | "longest">(
    "newest",
  );
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [removedToast, setRemovedToast] = useState<BrewSession | null>(null);
  const undoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removedActiveRef = useRef<ActiveSession | null>(null);
  useEffect(() => () => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
  }, []);

  const deleteSession = (id: string) => {
    const held = sessions.find((x) => x.id === id) ?? null;
    removedActiveRef.current =
      activeSessions.find((a) => a.logId === id) ?? null;
    useLog.getState().remove(id);
    useActiveSessions.getState().remove(id);
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    setRemovedToast(held);
    undoTimeout.current = setTimeout(() => setRemovedToast(null), 5000);
  };

  const undoDelete = () => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    if (removedToast) useLog.getState().add(removedToast);
    if (removedActiveRef.current)
      useActiveSessions.getState().upsert(removedActiveRef.current);
    setRemovedToast(null);
  };

  const toggleFavorite = (id: string, current: boolean | undefined) =>
    useLog.getState().update(id, { favorite: !current });

  const stats = useMemo(() => {
    if (sessions.length === 0) return null;
    const totalSteeps = sessions.reduce((sum, s) => sum + s.steepsCompleted, 0);
    const totalLeaf = sessions.reduce((sum, s) => sum + (s.gramsUsed ?? 0), 0);
    const brewTimes = sessions
      .map((s) => s.totalBrewMs)
      .filter((ms): ms is number => !!ms);
    const avgBrewMs = brewTimes.length
      ? brewTimes.reduce((a, b) => a + b, 0) / brewTimes.length
      : 0;

    const counts = new Map<string, number>();
    for (const s of sessions) counts.set(s.teaId, (counts.get(s.teaId) ?? 0) + 1);
    let favoriteTeaId: string | null = null;
    let favoriteCount = 0;
    for (const [id, count] of counts) {
      if (count > favoriteCount) {
        favoriteTeaId = id;
        favoriteCount = count;
      }
    }
    const favoriteTea = favoriteTeaId ? findTea(favoriteTeaId, custom) : undefined;

    // Streak: consecutive calendar days, counting back from today, with ≥1 session.
    const days = new Set(sessions.map((s) => new Date(s.startedAt).toDateString()));
    let streak = 0;
    const cursor = new Date();
    while (days.has(cursor.toDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      totalSessions: sessions.length,
      totalSteeps,
      totalLeaf,
      avgBrewMs,
      favoriteTea,
      streak,
    };
  }, [sessions, custom]);

  const heatmap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sessions) {
      const key = new Date(s.startedAt).toDateString();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: { count: number }[] = [];
    for (let i = 97; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ count: counts.get(d.toDateString()) ?? 0 });
    }
    return days;
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = sessions.filter((s) => {
      if (favoritesOnly && !s.favorite) return false;
      if (!q) return true;
      const tea = findTea(s.teaId, custom);
      const name = displayTeaName(s.teaName, tea, lang).toLowerCase();
      const tagsMatch = (s.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
      const noteMatch = (s.note ?? "").toLowerCase().includes(q);
      return name.includes(q) || tagsMatch || noteMatch;
    });
    if (sortBy === "rating") {
      list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === "longest") {
      list = [...list].sort((a, b) => (b.totalBrewMs ?? 0) - (a.totalBrewMs ?? 0));
    }
    return list;
  }, [sessions, query, favoritesOnly, sortBy, custom, lang]);

  const SWIPE_THRESHOLD = -80;
  const onSwipeEnd = (id: string, info: PanInfo) => {
    if (info.offset.x < SWIPE_THRESHOLD) {
      deleteSession(id);
    }
  };

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
          <TeaIcon icon="cake" className="mx-auto mb-3 h-12 w-12 text-line" />
          <p className="text-sm text-muted">{t.logEmpty}</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-bg"
          >
            {t.pickTea}
          </Link>
        </div>
      )}

      {stats && (
        <div className="mb-6 rounded-2xl border border-line bg-surface p-4">
          <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
            <div>
              <p className="font-display text-xl font-medium">{stats.totalSessions}</p>
              <p className="text-[11px] text-muted">{t.statsSessions}</p>
            </div>
            <div>
              <p className="font-display text-xl font-medium">{stats.totalSteeps}</p>
              <p className="text-[11px] text-muted">{t.statsSteeps}</p>
            </div>
            <div>
              <p className="font-display text-xl font-medium">
                {Math.round(stats.totalLeaf * 10) / 10}g
              </p>
              <p className="text-[11px] text-muted">{t.statsLeaf}</p>
            </div>
            <div>
              <p className="font-display text-xl font-medium">{stats.streak}</p>
              <p className="text-[11px] text-muted">{t.statsStreak}</p>
            </div>
            <div>
              <p className="font-display text-xl font-medium">
                {stats.avgBrewMs ? formatMs(stats.avgBrewMs) : "—"}
              </p>
              <p className="text-[11px] text-muted">{t.statsAvg}</p>
            </div>
            <div className="col-span-3 sm:col-span-1">
              <p className="font-display truncate text-sm font-medium">
                {stats.favoriteTea ? teaNames(stats.favoriteTea, lang).primary : "—"}
              </p>
              <p className="text-[11px] text-muted">{t.statsFavorite}</p>
            </div>
          </div>
          <p className="mt-4 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            {t.heatmapTitle}
          </p>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
            {heatmap.map((day, i) => (
              <div
                key={i}
                aria-hidden
                className="h-2.5 w-2.5 rounded-sm"
                style={{
                  background: "var(--ink)",
                  opacity:
                    day.count === 0 ? 0.08 : day.count === 1 ? 0.35 : day.count === 2 ? 0.65 : 1,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.logSearchPlaceholder}
            aria-label={t.logSearchPlaceholder}
            className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm placeholder:text-muted focus:border-muted focus:outline-none"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-full border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="newest">{t.sortNewest}</option>
            <option value="rating">{t.sortRating}</option>
            <option value="longest">{t.sortLongest}</option>
          </select>
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            aria-pressed={favoritesOnly}
            className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold ${
              favoritesOnly
                ? "border-ink bg-ink text-bg"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            ★ {t.favoritesOnly}
          </button>
        </div>
      )}

      {sessions.length > 0 && filteredSessions.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted">{t.noMatch(query)}</p>
      )}

      <ul className="space-y-2.5">
        <AnimatePresence initial={false}>
          {filteredSessions.map((s) => {
            const tea = findTea(s.teaId, custom);
            return (
              <motion.li
                key={s.id}
                layout
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 flex items-center justify-end bg-red-700 pr-6 text-sm font-bold text-white">
                  {t.remove}
                </div>
                <motion.div
                  data-log-id={s.id}
                  drag="x"
                  dragDirectionLock
                  dragConstraints={{ left: -96, right: 0 }}
                  dragElastic={{ left: 0.15, right: 0 }}
                  dragSnapToOrigin
                  onDragEnd={(_, info) => onSwipeEnd(s.id, info)}
                  className="relative rounded-2xl border border-line bg-surface p-4"
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
                </div>
                {activeSessions.some((a) => a.logId === s.id) ? (
                  <Link
                    href={`/session?tea=${s.teaId}`}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                    style={{ background: s.liquorColor }}
                  >
                    {t.resumeSession}
                  </Link>
                ) : (
                  <Link
                    href={`/session?tea=${s.teaId}${s.gramsUsed ? `&grams=${s.gramsUsed}` : ""}`}
                    className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
                  >
                    {t.brewAgain}
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
                <Link
                  href={`/log/entry?id=${s.id}`}
                  className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
                >
                  {t.viewDetails}
                </Link>
              </div>

              {s.note && (
                <p className="mt-2.5 border-l-2 pl-3 text-sm text-muted" style={{ borderColor: s.liquorColor }}>
                  {s.note}
                </p>
              )}
                </motion.div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <AnimatePresence>
        {removedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-20 z-20 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-full bg-ink px-5 py-3 text-sm text-bg shadow-lg"
          >
            <span>{t.removedToast}</span>
            <button
              onClick={undoDelete}
              className="font-bold underline underline-offset-2"
            >
              {t.undo}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
