import { create } from "zustand";
import type { StashItem } from "@/lib/types";
import { stashRepo } from "@/lib/repo";

interface StashStore {
  items: StashItem[];
  hydrated: boolean;
  hydrate: () => void;
  save: (item: StashItem) => void;
  remove: (teaId: string) => void;
  /** Called when a brew session starts; returns grams used (0 if not stashed). */
  consumeForSession: (teaId: string) => number;
}

export const useStash = create<StashStore>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: () => {
    set({ items: stashRepo.load() ?? [], hydrated: true });
  },

  save: (item) => {
    const items = get().items.filter((i) => i.teaId !== item.teaId);
    items.push(item);
    set({ items });
    stashRepo.save(items);
  },

  remove: (teaId) => {
    const items = get().items.filter((i) => i.teaId !== teaId);
    set({ items });
    stashRepo.save(items);
  },

  consumeForSession: (teaId) => {
    const item = get().items.find((i) => i.teaId === teaId);
    if (!item) return 0;
    const used = Math.min(item.gramsRemaining, item.gramsPerSession);
    const items = get().items.map((i) =>
      i.teaId === teaId
        ? { ...i, gramsRemaining: Math.max(0, i.gramsRemaining - used) }
        : i,
    );
    set({ items });
    stashRepo.save(items);
    return used;
  },
}));
