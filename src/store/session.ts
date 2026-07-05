import { create } from "zustand";
import type { SteepRecord, TeaProfile } from "@/lib/types";
import {
  finishTimer,
  idleTimer,
  nudgeTimer,
  pauseTimer,
  scaledSteepMs,
  startTimer,
  type TimerState,
} from "@/lib/timer";
import { leafGrams } from "@/lib/brew";
import { unlockAudio } from "@/lib/audio";
import { useActiveSessions } from "./activeSessions";
import { useLog } from "./log";
import { useStash } from "./stash";
import { useSettings } from "./settings";

interface SessionStore {
  tea: TeaProfile | null;
  /** Per-steep durations in ms, strength already applied. */
  steepDurations: number[];
  steepIndex: number;
  timer: TimerState;
  steepsCompleted: number;
  finished: boolean;
  logId: string | null;
  /** 1-based number of the steep that just chimed; consumed by the alarm UI. */
  justFinishedSteep: number | null;
  /** Cumulative ms actually spent steeping this session (nudges included). */
  totalBrewMs: number;
  /** When each pour started and how long it actually ran. */
  steeps: SteepRecord[];
  /** A short flash steep before steep 1 — doesn't count toward stats. */
  rinsing: boolean;

  begin: (tea: TeaProfile, strength: number) => void;
  startSteep: (gramsOverride?: number) => void;
  pause: () => void;
  resume: () => void;
  nudge: (deltaSec: number) => void;
  /** The rinse timer hit zero: move straight into steep 1, no stats recorded. */
  completeRinse: () => void;
  /** Steep timer hit zero: record it and advance (or wait, per profile). */
  completeSteep: () => void;
  /** Move to the next steep without brewing the current one. */
  skipSteep: () => void;
  /** Manual advance used when autoAdvance is off. */
  nextSteep: () => void;
  clearAlarm: () => void;
  end: () => void;
}

const EMPTY = {
  tea: null,
  steepDurations: [] as number[],
  steepIndex: 0,
  timer: idleTimer(0),
  steepsCompleted: 0,
  finished: false,
  logId: null,
  justFinishedSteep: null,
  totalBrewMs: 0,
  steeps: [] as SteepRecord[],
  rinsing: false,
};

const RINSE_MS = 5000;

export const useSession = create<SessionStore>((set, get) => ({
  ...EMPTY,

  begin: (tea, strength) => {
    // Switching away from a different, unfinished tea loses nothing — the
    // subscriber below keeps useActiveSessions current on every change.
    //
    // Resume this tea's own session if one's still unfinished, rather than
    // starting over.
    const existing = useActiveSessions
      .getState()
      .sessions.find((s) => s.teaId === tea.id);
    if (existing) {
      set({
        tea,
        steepDurations: existing.steepDurations,
        steepIndex: existing.steepIndex,
        timer: existing.timer,
        steepsCompleted: existing.steepsCompleted,
        finished: false,
        logId: existing.logId,
        justFinishedSteep: existing.justFinishedSteep,
        totalBrewMs: existing.totalBrewMs,
        steeps: existing.steeps,
        rinsing: existing.rinsing,
      });
      return;
    }

    const steepDurations = tea.steepsSec.map((s) => scaledSteepMs(s, strength));
    const rinsing = !!tea.hasRinse;
    // No log entry yet, and nothing resumable — just looking at the timer
    // shouldn't create history. That starts on the first real Start tap,
    // in startSteep().
    set({
      ...EMPTY,
      tea,
      steepDurations,
      timer: idleTimer(rinsing ? RINSE_MS : steepDurations[0]),
      rinsing,
    });
  },

  startSteep: (gramsOverride) => {
    unlockAudio();
    const { steepIndex, tea, steeps, rinsing } = get();
    let { logId } = get();
    if (!logId && tea) {
      logId = `brew-${Date.now().toString(36)}`;
      useLog.getState().add({
        id: logId,
        teaId: tea.id,
        teaName: tea.name,
        liquorColor: tea.liquorColor,
        startedAt: Date.now(),
        steepsCompleted: 0,
        totalSteeps: tea.steepsSec.length,
        tempC: tea.tempC,
        totalBrewMs: 0,
      });
    }
    // First real steep only (not the rinse): capture the leaf grams (from
    // the page's grams stepper, or derived from ratio+vessel if not given),
    // then deplete the stash once for the whole session.
    if (!rinsing && steepIndex === 0 && tea) {
      const vesselMl = useSettings.getState().vesselMl;
      const grams =
        gramsOverride ?? leafGrams(tea.ratioGramsPer100ml, vesselMl);
      useStash.getState().consumeForSession(tea.id, grams);
      if (logId) useLog.getState().update(logId, { gramsUsed: grams });
    }
    set({
      logId,
      timer: startTimer(get().timer),
      justFinishedSteep: null,
      // The rinse isn't a real steep — no history entry for it.
      steeps: rinsing
        ? steeps
        : [...steeps, { steepIndex, startedAt: Date.now(), durationMs: 0 }],
    });
  },

  completeRinse: () => {
    const { steepDurations } = get();
    set({
      rinsing: false,
      timer: idleTimer(steepDurations[0]),
      justFinishedSteep: null,
    });
  },

  pause: () => set({ timer: pauseTimer(get().timer) }),
  resume: () => set({ timer: startTimer(get().timer) }),
  nudge: (deltaSec) => set({ timer: nudgeTimer(get().timer, deltaSec * 1000) }),

  completeSteep: () => {
    const {
      tea,
      steepIndex,
      steepDurations,
      steepsCompleted,
      logId,
      timer,
      steeps,
    } = get();
    if (!tea) return;
    const completed = steepsCompleted + 1;
    const totalBrewMs = get().totalBrewMs + timer.durationMs;
    const updatedSteeps = steeps.map((s, i) =>
      i === steeps.length - 1 ? { ...s, durationMs: timer.durationMs } : s,
    );
    if (logId) {
      useLog.getState().update(logId, {
        steepsCompleted: completed,
        totalBrewMs,
        steeps: updatedSteeps,
      });
    }
    set({ totalBrewMs, steeps: updatedSteeps });
    const isLast = steepIndex >= steepDurations.length - 1;
    if (isLast) {
      set({
        steepsCompleted: completed,
        finished: true,
        timer: finishTimer(get().timer),
        justFinishedSteep: steepIndex + 1,
      });
    } else if (tea.autoAdvance) {
      set({
        steepsCompleted: completed,
        steepIndex: steepIndex + 1,
        timer: idleTimer(steepDurations[steepIndex + 1]),
        justFinishedSteep: steepIndex + 1,
      });
    } else {
      set({
        steepsCompleted: completed,
        timer: finishTimer(get().timer),
        justFinishedSteep: steepIndex + 1,
      });
    }
  },

  skipSteep: () => {
    const { steepIndex, steepDurations } = get();
    if (steepIndex >= steepDurations.length - 1) {
      set({ finished: true, timer: finishTimer(get().timer) });
    } else {
      set({
        steepIndex: steepIndex + 1,
        timer: idleTimer(steepDurations[steepIndex + 1]),
        justFinishedSteep: null,
      });
    }
  },

  nextSteep: () => {
    const { steepIndex, steepDurations } = get();
    if (steepIndex >= steepDurations.length - 1) {
      set({ finished: true });
    } else {
      set({
        steepIndex: steepIndex + 1,
        timer: idleTimer(steepDurations[steepIndex + 1]),
        justFinishedSteep: null,
      });
    }
  },

  clearAlarm: () => set({ justFinishedSteep: null }),
  end: () => {
    const { logId } = get();
    if (logId) useActiveSessions.getState().remove(logId);
    set({ ...EMPTY });
  },
}));

// Keep useActiveSessions in sync with whichever session is currently open,
// so a reload or closed tab can resume it — and any other unfinished
// session — later. A finished session has nothing left to resume, so it
// drops out of the list instead.
if (typeof window !== "undefined") {
  useSession.subscribe((state) => {
    if (!state.tea || !state.logId) return;
    if (state.finished) {
      useActiveSessions.getState().remove(state.logId);
      return;
    }
    useActiveSessions.getState().upsert({
      logId: state.logId,
      teaId: state.tea.id,
      steepIndex: state.steepIndex,
      steepDurations: state.steepDurations,
      steepsCompleted: state.steepsCompleted,
      totalBrewMs: state.totalBrewMs,
      timer: state.timer,
      justFinishedSteep: state.justFinishedSteep,
      steeps: state.steeps,
      rinsing: state.rinsing,
    });
  });
}
