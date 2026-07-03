import { create } from "zustand";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";
import { settingsRepo } from "@/lib/repo";

interface SettingsStore extends Settings {
  hydrated: boolean;
  hydrate: () => void;
  update: (patch: Partial<Settings>) => void;
}

export const useSettings = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: () => {
    const saved = settingsRepo.load();
    set({ ...DEFAULT_SETTINGS, ...saved, hydrated: true });
  },

  update: (patch) => {
    set(patch);
    const { hydrated, hydrate, update, ...settings } = get();
    void hydrated;
    void hydrate;
    void update;
    settingsRepo.save(settings);
  },
}));
