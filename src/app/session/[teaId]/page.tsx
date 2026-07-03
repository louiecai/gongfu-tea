"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { findTea, useProfiles } from "@/store/profiles";
import { useSession } from "@/store/session";
import { useSettings } from "@/store/settings";
import { useLog } from "@/store/log";
import { formatMs, isExpired, remainingMs } from "@/lib/timer";
import { playChime } from "@/lib/audio";
import { notifySteepDone, vibrate } from "@/lib/alerts";
import { TimerCup } from "@/components/TimerCup";
import { SteepDots } from "@/components/SteepDots";

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

export default function SessionPage() {
  const { teaId } = useParams<{ teaId: string }>();
  const router = useRouter();

  const custom = useProfiles((s) => s.custom);
  const profilesHydrated = useProfiles((s) => s.hydrated);
  const settings = useSettings();
  const session = useSession();
  const tea = findTea(teaId, custom);

  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

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
      notifySteepDone(session.tea.name, steepIndex + 1);
    }
    if (s.vibration) vibrate();
    useSession.getState().completeSteep();
    // Allow the next steep's alarm.
    setTimeout(() => {
      firedRef.current = false;
    }, 500);
  }, [session.tea, steepIndex]);

  // Display tick + expiry check. Timestamp math keeps this accurate even if
  // frames are throttled in a background tab.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      setNow(Date.now());
      if (isExpired(useSession.getState().timer)) {
        fireAlarm();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // Backup for throttled tabs: fire right at the deadline.
    const left = remainingMs(timer);
    const backup = setTimeout(() => {
      if (isExpired(useSession.getState().timer)) fireAlarm();
    }, left + 50);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(backup);
    };
  }, [running, timer, fireAlarm]);

  if (!tea) {
    if (!profilesHydrated) return null;
    return (
      <div className="pt-20 text-center">
        <p className="text-muted">This tea isn’t on the shelf.</p>
        <Link href="/" className="mt-3 inline-block font-semibold underline">
          Back to teas
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

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <header className="mb-2 flex items-start justify-between gap-3">
        <button
          onClick={() => {
            session.end();
            router.push("/");
          }}
          className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
        >
          ← End
        </button>
        <div className="text-right">
          <h1 className="font-display text-xl font-medium leading-tight">
            {tea.name}
          </h1>
          {tea.chineseName && (
            <p className="text-xs text-muted">{tea.chineseName}</p>
          )}
        </div>
      </header>

      <div className="mb-4 flex justify-center gap-2 text-[11px] font-semibold text-muted">
        <span className="rounded-full border border-line px-2.5 py-1">
          {tea.tempC}°C
        </span>
        <span className="rounded-full border border-line px-2.5 py-1">
          {tea.ratioGramsPer100ml} g / 100 ml
        </span>
        {settings.strength !== 1 && (
          <span className="rounded-full border border-line px-2.5 py-1">
            strength ×{settings.strength.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}
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
              Steep {steepIndex + 1} of {totalSteeps}
            </p>

            <TimerCup
              progress={doneWaiting ? 1 : elapsed}
              color={color}
              ripple={doneWaiting || session.justFinishedSteep !== null}
            >
              <span className="font-display tabular text-5xl font-medium">
                {doneWaiting ? "0:00" : formatMs(leftMs)}
              </span>
              <span className="mt-1 text-xs text-muted">
                {doneWaiting
                  ? "poured — ready for the next?"
                  : running
                    ? "steeping…"
                    : timer.status === "paused"
                      ? "paused"
                      : session.justFinishedSteep
                        ? "pour, then start when ready"
                        : "tap start when the water’s in"}
              </span>
            </TimerCup>

            <div className="mt-4 mb-6">
              <SteepDots
                total={totalSteeps}
                current={steepIndex}
                completed={steepsCompleted}
                color={color}
              />
            </div>

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
                    Next steep →
                  </button>
                ) : running ? (
                  <button
                    onClick={session.pause}
                    className="h-14 flex-1 max-w-56 rounded-full border-2 text-base font-bold transition-transform active:scale-95"
                    style={{ borderColor: color, color }}
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={
                      timer.status === "paused"
                        ? session.resume
                        : session.startSteep
                    }
                    className="h-14 flex-1 max-w-56 rounded-full text-base font-bold text-white shadow-lg transition-transform active:scale-95"
                    style={{ background: color, boxShadow: `0 8px 24px -8px ${color}` }}
                  >
                    {timer.status === "paused" ? "Resume" : "Start steep"}
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
                  Skip this steep
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
        That’s the last steep
      </h2>
      <p className="mt-1 text-sm text-muted">
        {session.steepsCompleted} of {session.steepDurations.length} steeps
        poured. How was it?
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
        placeholder="Tasting note — aroma, body, how many steeps it held…"
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
          {saved ? "Saved ✓" : "Save to log"}
        </button>
        <button
          onClick={() => {
            session.end();
            router.push("/");
          }}
          className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-muted hover:text-ink"
        >
          Done
        </button>
      </div>
    </motion.div>
  );
}
