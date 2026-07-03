import { create } from "zustand";
import type { BrewSession } from "@/lib/types";
import { logRepo } from "@/lib/repo";

interface LogStore {
  sessions: BrewSession[];
  hydrated: boolean;
  hydrate: () => void;
  add: (session: BrewSession) => void;
  update: (id: string, patch: Partial<BrewSession>) => void;
  remove: (id: string) => void;
}

export const useLog = create<LogStore>((set, get) => ({
  sessions: [],
  hydrated: false,

  hydrate: () => {
    set({ sessions: logRepo.load() ?? [], hydrated: true });
  },

  add: (session) => {
    const sessions = [session, ...get().sessions].slice(0, 500);
    set({ sessions });
    logRepo.save(sessions);
  },

  update: (id, patch) => {
    const sessions = get().sessions.map((s) =>
      s.id === id ? { ...s, ...patch } : s,
    );
    set({ sessions });
    logRepo.save(sessions);
  },

  remove: (id) => {
    const sessions = get().sessions.filter((s) => s.id !== id);
    set({ sessions });
    logRepo.save(sessions);
  },
}));
