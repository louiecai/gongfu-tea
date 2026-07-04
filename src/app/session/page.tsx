"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { findTea, useProfiles } from "@/store/profiles";
import { useSession } from "@/store/session";
import { useSettings } from "@/store/settings";
import { useLog } from "@/store/log";
import { formatMs, isExpired, remainingMs } from "@/lib/timer";
import { leafGrams } from "@/lib/brew";
import { playChime } from "@/lib/audio";
import { notifySteepDone, vibrate } from "@/lib/alerts";
import { TimerCup } from "@/components/TimerCup";
import { SteepDots } from "@/components/SteepDots";
import { STRINGS, teaNames } from "@/lib/i18n";
import { useT } from "@/store/useT";

// Prefer a real back-navigation so the browser/Next restores wherever the
// user scrolled to (a fresh push always lands at the top). Only push a new
// entry when there's nothing to go back to, e.g. a direct deep link.
function leaveSession(router: ReturnType<typeof useRouter>) {
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back();
  } else {
    router.push("/");
  }
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) void lock.release();
      } catch {
        // low battery or unsupported — not critical
      }
    };
    void acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [active]);
}

function SessionPageInner() {
  const teaId = useSearchParams().get("tea") ?? "";
  const router = useRouter();

  const custom = useProfiles((s) => s.custom);
  const profilesHydrated = useProfiles((s) => s.hydrated);
  const settings = useSettings();
  const session = useSession();
  const { t, lang } = useT();
  const tea = findTea(teaId, custom);

  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);
  // A direct override for leaf grams, independent of the vessel-derived
  // default. Resets whenever the tea changes so a new session starts fresh.
  const [gramsOverride, setGramsOverride] = useState<number | null>(null);
  useEffect(() => {
    setGramsOverride(null);
  }, [tea?.id]);

  // Start (or resume) a session for this tea.
  useEffect(() => {
    if (!tea || !profilesHydrated) return;
    if (useSession.getState().tea?.id !== tea.id) {
      useSession.getState().begin(tea, useSettings.getState().strength);
    }
  }, [tea, profilesHydrated]);

  const { timer, steepIndex, steepDurations, steepsCompleted, finished } =
    session;
  const running = timer.status === "running";

  useWakeLock(running && settings.keepScreenOn);

  const fireAlarm = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const s = useSettings.getState();
    if (s.sound) playChime();
    if (s.notifications && session.tea) {
      const strings = STRINGS[s.language];
      const names = teaNames(session.tea, s.language);
      notifySteepDone(
        strings.steepDoneTitle(names.primary, steepIndex + 1),
        strings.steepDoneBody,
      );
    }
    if (s.vibration) vibrate();
    useSession.getState().completeSteep();
    // Allow the next steep's alarm.
    setTimeout(() => {
      firedRef.current = false;
    }, 500);
  }, [session.tea, steepIndex]);

  // Display tick + expiry check. A plain interval, not requestAnimationFrame —
  // mobile Safari aggressively throttles rAF during idle foreground time (no
  // touch/scroll), only "waking" it on interaction, which froze the countdown
  // ring and liquid until something else forced a re-render. setInterval
  // doesn't get throttled the same way. Timestamp math (not tick count) keeps
  // the actual time accurate regardless of tick cadence.
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      setNow(Date.now());
      if (isExpired(useSession.getState().timer)) fireAlarm();
    };
    tick();
    const interval = setInterval(tick, 200);
    // Backup in case the interval itself gets throttled: fire right at the
    // deadline regardless.
    const left = remainingMs(timer);
    const backup = setTimeout(() => {
      if (isExpired(useSession.getState().timer)) fireAlarm();
    }, left + 50);
    return () => {
      clearInterval(interval);
      clearTimeout(backup);
    };
  }, [running, timer, fireAlarm]);

  if (!tea) {
    if (!profilesHydrated) return null;
    return (
      <div className="pt-20 text-center">
        <p className="text-muted">{t.teaNotFound}</p>
        <Link href="/" className="mt-3 inline-block font-semibold underline">
          {t.backToTeas}
        </Link>
      </div>
    );
  }
  if (!session.tea || session.tea.id !== tea.id) return null;

  const durationMs = timer.durationMs || 1;
  const leftMs = remainingMs(timer, now);
  const elapsed = finished ? 1 : 1 - leftMs / durationMs;
  const doneWaiting = timer.status === "done" && !finished;
  const color = tea.liquorColor;
  const totalSteeps = steepDurations.length;
  const grams =
    gramsOverride ?? leafGrams(tea.ratioGramsPer100ml, settings.vesselMl);
  // Grams and vessel are fixed for the log the moment the first steep
  // starts, so lock both steppers once brewing is underway to avoid a
  // display/log mismatch.
  const vesselLocked = steepIndex > 0 || timer.status !== "idle";
  const adjustVessel = (deltaMl: number) =>
    useSettings
      .getState()
      .update({ vesselMl: Math.min(500, Math.max(20, settings.vesselMl + deltaMl)) });
  const adjustGrams = (delta: number) =>
    setGramsOverride(Math.min(30, Math.max(0.5, Math.round((grams + delta) * 10) / 10)));

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <header className="mb-2 flex items-start justify-between gap-3">
        <button
          onClick={() => leaveSession(router)}
          className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
        >
          {t.back}
        </button>
        <div className="text-right">
          <h1 className="font-display text-xl font-medium leading-tight">
            {teaNames(tea, lang).primary}
          </h1>
          {teaNames(tea, lang).secondary && (
            <p className="text-xs text-muted">{teaNames(tea, lang).secondary}</p>
          )}
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-muted">
        <span className="rounded-full border border-line px-2.5 py-1">
          {tea.tempC}°C
        </span>
        <span className="flex items-center gap-0.5 rounded-full border border-line py-1 pl-1 pr-1.5">
          <button
            type="button"
            onClick={() => adjustGrams(-0.5)}
            disabled={vesselLocked}
            aria-label={t.decreaseGrams}
            className="flex h-5 w-5 items-center justify-center rounded-full disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-[3ch] text-center">{grams} g</span>
          <button
            type="button"
            onClick={() => adjustGrams(0.5)}
            disabled={vesselLocked}
            aria-label={t.increaseGrams}
            className="flex h-5 w-5 items-center justify-center rounded-full disabled:opacity-30"
          >
            +
          </button>
        </span>
        <span className="flex items-center gap-0.5 rounded-full border border-line py-1 pl-1 pr-1.5">
          <button
            type="button"
            onClick={() => adjustVessel(-10)}
            disabled={vesselLocked}
            aria-label={t.decreaseVessel}
            className="flex h-5 w-5 items-center justify-center rounded-full disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-[3.5ch] text-center">{settings.vesselMl} ml</span>
          <button
            type="button"
            onClick={() => adjustVessel(10)}
            disabled={vesselLocked}
            aria-label={t.increaseVessel}
            className="flex h-5 w-5 items-center justify-center rounded-full disabled:opacity-30"
          >
            +
          </button>
        </span>
        {settings.strength !== 1 && (
          <span className="rounded-full border border-line px-2.5 py-1">
            {t.strengthChip(
              settings.strength.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""),
            )}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {finished ? (
          <FinishedView key="done" color={color} />
        ) : (
          <motion.div
            key="brewing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex flex-1 flex-col"
          >
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {t.steepOf(steepIndex + 1, totalSteeps)}
            </p>

            <TimerCup
              progress={doneWaiting ? 1 : elapsed}
              color={color}
              ripple={doneWaiting || session.justFinishedSteep !== null}
              idle={timer.status === "idle"}
            >
              <span className="font-display tabular text-5xl font-medium">
                {doneWaiting ? "0:00" : formatMs(leftMs)}
              </span>
              <span className="mt-1 text-xs text-muted">
                {doneWaiting
                  ? t.pouredReady
                  : running
                    ? t.steeping
                    : timer.status === "paused"
                      ? t.paused
                      : session.justFinishedSteep
                        ? t.pourThenStart
                        : t.tapStart}
              </span>
            </TimerCup>

            <div className="mt-4 mb-2">
              <SteepDots
                total={totalSteeps}
                current={steepIndex}
                completed={steepsCompleted}
                color={color}
              />
            </div>

            {steepsCompleted > 0 && (
              <p className="mb-4 text-center text-[11px] text-muted">
                {t.sessionStats(
                  steepsCompleted,
                  steepsCompleted * settings.vesselMl,
                  formatMs(session.totalBrewMs),
                )}
              </p>
            )}

            <div className="mt-auto space-y-3 pb-2">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => session.nudge(-5)}
                  disabled={doneWaiting}
                  className="h-11 w-14 rounded-full border border-line bg-surface text-sm font-bold text-muted transition-colors hover:text-ink disabled:opacity-40"
                >
                  −5s
                </button>

                {doneWaiting ? (
                  <button
                    onClick={session.nextSteep}
                    className="h-14 flex-1 max-w-56 rounded-full text-base font-bold text-white shadow-lg transition-transform active:scale-95"
                    style={{ background: color, boxShadow: `0 8px 24px -8px ${color}` }}
                  >
                    {t.nextSteep}
                  </button>
                ) : running ? (
                  <button
                    onClick={session.pause}
                    className="h-14 flex-1 max-w-56 rounded-full border-2 text-base font-bold transition-transform active:scale-95"
                    style={{ borderColor: color, color }}
                  >
                    {t.pause}
                  </button>
                ) : (
                  <button
                    onClick={
                      timer.status === "paused"
                        ? session.resume
                        : () => session.startSteep(grams)
                    }
                    className="h-14 flex-1 max-w-56 rounded-full text-base font-bold text-white shadow-lg transition-transform active:scale-95"
                    style={{ background: color, boxShadow: `0 8px 24px -8px ${color}` }}
                  >
                    {timer.status === "paused" ? t.resume : t.startSteep}
                  </button>
                )}

                <button
                  onClick={() => session.nudge(5)}
                  disabled={doneWaiting}
                  className="h-11 w-14 rounded-full border border-line bg-surface text-sm font-bold text-muted transition-colors hover:text-ink disabled:opacity-40"
                >
                  +5s
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={session.skipSteep}
                  className="text-xs font-semibold text-muted underline-offset-2 hover:underline"
                >
                  {t.skipSteep}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FinishedView({ color }: { color: string }) {
  const session = useSession();
  const router = useRouter();
  const { t } = useT();
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (session.logId) {
      useLog.getState().update(session.logId, {
        rating: rating || undefined,
        note: note.trim() || undefined,
      });
    }
    setSaved(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col items-center pt-8 text-center"
    >
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full text-3xl"
        style={{ background: `color-mix(in srgb, ${color} 20%, transparent)` }}
      >
        🍵
      </span>
      <h2 className="font-display mt-5 text-2xl font-medium">
        {t.lastSteepTitle}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {t.lastSteepBody(session.steepsCompleted, session.steepDurations.length)}
      </p>

      <div className="mt-5 flex gap-1.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={rating === n}
            onClick={() => setRating(n)}
            className={`text-2xl transition-transform hover:scale-110 ${
              n <= rating ? "" : "opacity-25 grayscale"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.notePlaceholder}
        rows={3}
        className="mt-4 w-full max-w-sm rounded-2xl border border-line bg-surface p-3 text-sm placeholder:text-muted focus:border-muted focus:outline-none"
      />

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saved}
          className="rounded-full px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
          style={{ background: color }}
        >
          {saved ? t.saved : t.saveToLog}
        </button>
        <button
          onClick={() => {
            session.end();
            leaveSession(router);
          }}
          className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-muted hover:text-ink"
        >
          {t.done}
        </button>
      </div>
    </motion.div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={null}>
      <SessionPageInner />
    </Suspense>
  );
}
