"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import {
  closeProgressNotification,
  notifyProgress,
  notifySteepDone,
  vibrate,
} from "@/lib/alerts";
import { TimerCup } from "@/components/TimerCup";
import { SteepDots } from "@/components/SteepDots";
import { STRINGS, teaNames, vesselDisplayName } from "@/lib/i18n";
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

type PipRequester = {
  requestWindow: (opts?: { width?: number; height?: number }) => Promise<Window>;
};

function usePipWindow() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const open = useCallback(async () => {
    const dpip = (window as Window & { documentPictureInPicture?: PipRequester })
      .documentPictureInPicture;
    if (!dpip) return;
    const win = await dpip.requestWindow({ width: 260, height: 170 });
    win.document.body.style.margin = "0";
    win.document.body.style.background = "#f6f1e7";
    win.addEventListener("pagehide", () => setPipWindow(null), { once: true });
    setPipWindow(win);
  }, []);
  // Closes the popup if the session page unmounts while it's still open;
  // a no-op re-close when the popup already closed itself via pagehide.
  useEffect(() => () => pipWindow?.close(), [pipWindow]);
  return { pipWindow, open };
}

function PipContent({
  teaName,
  color,
  leftMs,
  progress,
}: {
  teaName: string;
  color: string;
  leftMs: number;
  progress: number;
}) {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        height: "100vh",
        boxSizing: "border-box",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 600,
          color: "#8a8070",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
        }}
      >
        {teaName}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 40,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          color: "#2b2620",
        }}
      >
        {formatMs(leftMs)}
      </p>
      <div
        style={{
          width: "100%",
          height: 6,
          borderRadius: 999,
          background: "#e4ddcd",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(1, Math.max(0, progress)) * 100}%`,
            height: "100%",
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function SessionPageInner() {
  const params = useSearchParams();
  const teaId = params.get("tea") ?? "";
  const gramsParam = params.get("grams");
  const router = useRouter();

  const custom = useProfiles((s) => s.custom);
  const profilesHydrated = useProfiles((s) => s.hydrated);
  const settings = useSettings();
  const session = useSession();
  const { t, lang } = useT();
  const tea = findTea(teaId, custom);

  const [now, setNow] = useState(() => Date.now());
  const [announcement, setAnnouncement] = useState("");
  const announcedTenRef = useRef(false);
  const firedRef = useRef(false);
  const gramsRef = useRef(0);
  // A direct override for leaf grams, independent of the vessel-derived
  // default. A "Brew again" link can seed this via ?grams=; otherwise resets
  // whenever the tea actually changes (not on the initial hydration) so a
  // fresh session starts from the vessel-derived default.
  const [gramsOverride, setGramsOverride] = useState<number | null>(() => {
    const g = gramsParam ? Number(gramsParam) : NaN;
    return Number.isFinite(g) && g > 0 ? g : null;
  });
  const prevTeaId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevTeaId.current !== undefined && prevTeaId.current !== tea?.id) {
      setGramsOverride(null);
    }
    prevTeaId.current = tea?.id;
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
  const { pipWindow, open: openPip } = usePipWindow();
  const [pipSupported, setPipSupported] = useState(false);
  useEffect(() => {
    setPipSupported("documentPictureInPicture" in window);
  }, []);

  const fireAlarm = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const s = useSettings.getState();
    if (s.sound) playChime(s.chimeStyle);
    if (session.rinsing) {
      // Quieter cue — no "steep done" notification for a rinse.
      if (s.vibration) vibrate();
      useSession.getState().completeRinse();
    } else {
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
    }
    // Allow the next steep's alarm.
    setTimeout(() => {
      firedRef.current = false;
    }, 500);
  }, [session.tea, session.rinsing, steepIndex]);

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
      const liveTimer = useSession.getState().timer;
      if (isExpired(liveTimer)) {
        fireAlarm();
      } else if (remainingMs(liveTimer) <= 10000 && !announcedTenRef.current) {
        announcedTenRef.current = true;
        setAnnouncement(t.announceTenSeconds);
      }
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
  }, [running, timer, fireAlarm, t]);

  // A screen reader shouldn't hear every tick — only the two checkpoints that
  // matter: the 10-second warning (announced above) and the steep finishing.
  useEffect(() => {
    announcedTenRef.current = false;
  }, [steepIndex, session.rinsing]);

  useEffect(() => {
    if (session.justFinishedSteep !== null) setAnnouncement(t.announceSteepDone);
  }, [session.justFinishedSteep, t]);

  // Desktop shortcuts: Space mirrors whatever the main button currently does,
  // ←/→ nudge like the on-screen ∓5s buttons. Skipped while typing (the rating
  // textarea on the finished screen).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const s = useSession.getState();
      if (s.finished) return;
      const isDone = s.timer.status === "done";
      if (e.code === "Space") {
        e.preventDefault();
        if (isDone) s.nextSteep();
        else if (s.timer.status === "running") s.pause();
        else if (s.timer.status === "paused") s.resume();
        else s.startSteep(gramsRef.current);
      } else if (e.key === "ArrowLeft") {
        if (!isDone) s.nudge(-5);
      } else if (e.key === "ArrowRight") {
        if (!isDone) s.nudge(5);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Notifications can't drive a smooth per-second countdown, so while the tab
  // is backgrounded a slow-cadence same-tag update at least confirms the brew
  // is still going. Closed the moment focus returns, the steep pauses, or it
  // finishes.
  useEffect(() => {
    if (!running || session.rinsing) return;
    const s = useSettings.getState();
    if (!s.notifications || !session.tea) return;
    const strings = STRINGS[s.language];
    const names = teaNames(session.tea, s.language);
    const ping = () => {
      if (!document.hidden) return;
      const left = remainingMs(useSession.getState().timer);
      notifyProgress(
        strings.progressTitle(names.primary),
        strings.progressBody(formatMs(left)),
      );
    };
    const interval = setInterval(ping, 25000);
    const onVisible = () => {
      if (!document.hidden) closeProgressNotification();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      closeProgressNotification();
    };
  }, [running, session.rinsing, session.tea]);

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
  gramsRef.current = grams;
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
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
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

      {settings.vesselProfiles.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
          {settings.vesselProfiles.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={vesselLocked}
              onClick={() => useSettings.getState().update({ vesselMl: v.ml })}
              aria-pressed={settings.vesselMl === v.ml}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-30 ${
                settings.vesselMl === v.ml
                  ? "border-ink text-ink"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {vesselDisplayName(v.id, v.name, lang)} · {v.ml} ml
            </button>
          ))}
        </div>
      )}

      {pipSupported && !finished && (
        <div className="mb-2 text-center">
          <button
            type="button"
            onClick={() => (pipWindow ? pipWindow.focus() : void openPip())}
            className="text-xs font-semibold text-muted underline-offset-2 hover:underline"
          >
            {t.popOutTimer}
          </button>
        </div>
      )}
      {pipWindow &&
        createPortal(
          <PipContent
            teaName={teaNames(tea, lang).primary}
            color={color}
            leftMs={doneWaiting ? 0 : leftMs}
            progress={doneWaiting ? 1 : elapsed}
          />,
          pipWindow.document.body,
        )}

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
              {session.rinsing ? t.rinseLabel : t.steepOf(steepIndex + 1, totalSteeps)}
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

            {!session.rinsing && (
              <div className="mt-4 mb-2">
                <SteepDots
                  total={totalSteeps}
                  current={steepIndex}
                  completed={steepsCompleted}
                  color={color}
                />
              </div>
            )}

            {!session.rinsing && steepsCompleted > 0 && (
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
                    {timer.status === "paused"
                      ? t.resume
                      : session.rinsing
                        ? t.startRinse
                        : t.startSteep}
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
                  onClick={session.rinsing ? session.completeRinse : session.skipSteep}
                  className="text-xs font-semibold text-muted underline-offset-2 hover:underline"
                >
                  {session.rinsing ? t.skipRinse : t.skipSteep}
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
