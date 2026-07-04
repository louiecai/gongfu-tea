import { create } from "zustand";
import type { TeaProfile } from "@/lib/types";
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

  begin: (tea: TeaProfile, strength: number) => void;
  startSteep: () => void;
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
};

export const useSession = create<SessionStore>((set, get) => ({
  ...EMPTY,

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

  startSteep: () => {
    unlockAudio();
    const { steepIndex, tea, logId } = get();
    // First steep only: capture the leaf grams for whatever vessel size is
    // dialed in right now (the user may have just adjusted it), then deplete
    // the stash once for the whole session.
    if (steepIndex === 0 && tea) {
      const vesselMl = useSettings.getState().vesselMl;
      const grams = leafGrams(tea.ratioGramsPer100ml, vesselMl);
      useStash.getState().consumeForSession(tea.id, grams);
      if (logId) useLog.getState().update(logId, { gramsUsed: grams });
    }
    set({ timer: startTimer(get().timer), justFinishedSteep: null });
  },

  pause: () => set({ timer: pauseTimer(get().timer) }),
  resume: () => set({ timer: startTimer(get().timer) }),
  nudge: (deltaSec) => set({ timer: nudgeTimer(get().timer, deltaSec * 1000) }),

  completeSteep: () => {
    const { tea, steepIndex, steepDurations, steepsCompleted, logId, timer } =
      get();
    if (!tea) return;
    const completed = steepsCompleted + 1;
    const totalBrewMs = get().totalBrewMs + timer.durationMs;
    if (logId) {
      useLog.getState().update(logId, { steepsCompleted: completed, totalBrewMs });
    }
    set({ totalBrewMs });
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
