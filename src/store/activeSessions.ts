import { create } from "zustand";
import type { ActiveSession } from "@/lib/types";
import { activeSessionsRepo } from "@/lib/repo";

interface ActiveSessionsStore {
  /** Every currently unfinished brew, one per logId — lets several stay resumable at once. */
  sessions: ActiveSession[];
  hydrated: boolean;
  hydrate: () => void;
  upsert: (session: ActiveSession) => void;
  remove: (logId: string) => void;
}

export const useActiveSessions = create<ActiveSessionsStore>((set, get) => ({
  sessions: [],
  hydrated: false,

  hydrate: () => {
    set({ sessions: activeSessionsRepo.load() ?? [], hydrated: true });
  },

  upsert: (session) => {
    const sessions = [
      ...get().sessions.filter((s) => s.logId !== session.logId),
      session,
    ];
    set({ sessions });
    activeSessionsRepo.save(sessions);
  },

  remove: (logId) => {
    const sessions = get().sessions.filter((s) => s.logId !== logId);
    set({ sessions });
    activeSessionsRepo.save(sessions);
  },
}));
