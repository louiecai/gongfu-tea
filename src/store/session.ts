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
import { activeSessionRepo } from "@/lib/repo";
import { useLog } from "./log";
import { useStash } from "./stash";
import { useSettings } from "./settings";
import { findTea, useProfiles } from "./profiles";

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

  /** Restore a session left running when the app was last closed. */
  hydrate: () => void;
  begin: (tea: TeaProfile, strength: number) => void;
  startSteep: (gramsOverride?: number) => void;
  pause: () => void;
  resume: () => void;
  nudge: (deltaSec: number) => void;
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
};

export const useSession = create<SessionStore>((set, get) => ({
  ...EMPTY,

  hydrate: () => {
    const saved = activeSessionRepo.load();
    if (!saved) return;
    const tea = findTea(saved.teaId, useProfiles.getState().custom);
    if (!tea) {
      // The tea behind this session was deleted — nothing to resume into.
      activeSessionRepo.save(null);
      return;
    }
    set({
      tea,
      steepDurations: saved.steepDurations,
      steepIndex: saved.steepIndex,
      timer: saved.timer,
      steepsCompleted: saved.steepsCompleted,
      finished: false,
      logId: saved.logId,
      justFinishedSteep: saved.justFinishedSteep,
      totalBrewMs: saved.totalBrewMs,
      steeps: saved.steeps,
    });
  },

  begin: (tea, strength) => {
    const steepDurations = tea.steepsSec.map((s) => scaledSteepMs(s, strength));
    const logId = `brew-${Date.now().toString(36)}`;
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
    set({
      ...EMPTY,
      tea,
      steepDurations,
      timer: idleTimer(steepDurations[0]),
      logId,
    });
  },

  startSteep: (gramsOverride) => {
    unlockAudio();
    const { steepIndex, tea, logId, steeps } = get();
    // First steep only: capture the leaf grams (from the page's grams
    // stepper, or derived from ratio+vessel if not given), then deplete the
    // stash once for the whole session.
    if (steepIndex === 0 && tea) {
      const vesselMl = useSettings.getState().vesselMl;
      const grams =
        gramsOverride ?? leafGrams(tea.ratioGramsPer100ml, vesselMl);
      useStash.getState().consumeForSession(tea.id, grams);
      if (logId) useLog.getState().update(logId, { gramsUsed: grams });
    }
    set({
      timer: startTimer(get().timer),
      justFinishedSteep: null,
      steeps: [...steeps, { steepIndex, startedAt: Date.now(), durationMs: 0 }],
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
  end: () => set({ ...EMPTY }),
}));

// Persist the live session after every change, so a reload or closed tab can
// resume exactly where it left off. A finished (or ended) session has
// nothing left to resume, so it clears the record instead.
if (typeof window !== "undefined") {
  useSession.subscribe((state) => {
    if (!state.tea || !state.logId || state.finished) {
      activeSessionRepo.save(null);
      return;
    }
    activeSessionRepo.save({
      logId: state.logId,
      teaId: state.tea.id,
      steepIndex: state.steepIndex,
      steepDurations: state.steepDurations,
      steepsCompleted: state.steepsCompleted,
      totalBrewMs: state.totalBrewMs,
      timer: state.timer,
      justFinishedSteep: state.justFinishedSteep,
      steeps: state.steeps,
    });
  });
}
