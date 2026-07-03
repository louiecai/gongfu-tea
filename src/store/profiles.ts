import { create } from "zustand";
import type { TeaProfile } from "@/lib/types";
import { profilesRepo } from "@/lib/repo";
import { PRESET_TEAS } from "@/lib/teas";

interface ProfilesStore {
  custom: TeaProfile[];
  hydrated: boolean;
  hydrate: () => void;
  save: (profile: TeaProfile) => void;
  remove: (id: string) => void;
}

export const useProfiles = create<ProfilesStore>((set, get) => ({
  custom: [],
  hydrated: false,

  hydrate: () => {
    set({ custom: profilesRepo.load() ?? [], hydrated: true });
  },

  save: (profile) => {
    const custom = get().custom.filter((p) => p.id !== profile.id);
    custom.push({ ...profile, custom: true });
    set({ custom });
    profilesRepo.save(custom);
  },

  remove: (id) => {
    const custom = get().custom.filter((p) => p.id !== id);
    set({ custom });
    profilesRepo.save(custom);
  },
}));

/** Look up any tea — preset or custom — by id. */
export function findTea(
  id: string,
  custom: TeaProfile[],
): TeaProfile | undefined {
  return PRESET_TEAS.find((t) => t.id === id) ?? custom.find((t) => t.id === id);
}
