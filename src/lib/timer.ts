export type TimerStatus = "idle" | "running" | "paused" | "done";

export interface TimerState {
  status: TimerStatus;
  /** Epoch ms when the running steep ends. Only meaningful while running. */
  endsAt: number | null;
  /** Ms left while idle/paused; snapshot taken on pause. */
  remainingMs: number;
  /** Full duration of the current steep in ms (after strength/nudges). */
  durationMs: number;
}

export function idleTimer(durationMs: number): TimerState {
  return { status: "idle", endsAt: null, remainingMs: durationMs, durationMs };
}

export function startTimer(t: TimerState, now = Date.now()): TimerState {
  if (t.status === "running" || t.status === "done") return t;
  return { ...t, status: "running", endsAt: now + t.remainingMs };
}

export function pauseTimer(t: TimerState, now = Date.now()): TimerState {
  if (t.status !== "running" || t.endsAt === null) return t;
  return {
    ...t,
    status: "paused",
    endsAt: null,
    remainingMs: Math.max(0, t.endsAt - now),
  };
}

/** Ms remaining right now, whatever the status. */
export function remainingMs(t: TimerState, now = Date.now()): number {
  if (t.status === "running" && t.endsAt !== null) {
    return Math.max(0, t.endsAt - now);
  }
  if (t.status === "done") return 0;
  return t.remainingMs;
}

export function isExpired(t: TimerState, now = Date.now()): boolean {
  return t.status === "running" && t.endsAt !== null && now >= t.endsAt;
}

/** ±deltaMs on the current steep. Works running or paused; clamps at 1s. */
export function nudgeTimer(
  t: TimerState,
  deltaMs: number,
  now = Date.now(),
): TimerState {
  const MIN = 1000;
  if (t.status === "running" && t.endsAt !== null) {
    const left = Math.max(MIN, t.endsAt - now + deltaMs);
    return {
      ...t,
      endsAt: now + left,
      durationMs: Math.max(MIN, t.durationMs + deltaMs),
    };
  }
  if (t.status === "idle" || t.status === "paused") {
    const left = Math.max(MIN, t.remainingMs + deltaMs);
    return {
      ...t,
      remainingMs: left,
      durationMs: Math.max(MIN, t.durationMs + deltaMs),
    };
  }
  return t;
}

export function finishTimer(t: TimerState): TimerState {
  return { ...t, status: "done", endsAt: null, remainingMs: 0 };
}

/** Apply the global strength multiplier to a steep's base seconds. */
export function scaledSteepMs(baseSec: number, strength: number): number {
  return Math.max(1000, Math.round(baseSec * strength) * 1000);
}

/** "1:05" / "0:42" style display. */
export function formatSeconds(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function formatMs(ms: number): string {
  return formatSeconds(ms / 1000);
}
