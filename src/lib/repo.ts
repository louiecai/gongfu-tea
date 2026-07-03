import type { BrewSession, Settings, StashItem, TeaProfile } from "./types";

/**
 * Persistence boundary. Everything below the stores goes through a Repo so a
 * backend implementation can replace LocalStorageRepo without touching UI.
 */
export interface Repo<T> {
  load(): T | null;
  save(value: T): void;
}

class LocalStorageRepo<T> implements Repo<T> {
  constructor(private key: string) {}

  load(): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  save(value: T): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(this.key, JSON.stringify(value));
    } catch {
      // storage full or blocked — fail quietly, app still works in-memory
    }
  }
}

const PREFIX = "gongfu.";

export const profilesRepo: Repo<TeaProfile[]> = new LocalStorageRepo(
  `${PREFIX}profiles`,
);
export const logRepo: Repo<BrewSession[]> = new LocalStorageRepo(
  `${PREFIX}log`,
);
export const stashRepo: Repo<StashItem[]> = new LocalStorageRepo(
  `${PREFIX}stash`,
);
export const settingsRepo: Repo<Settings> = new LocalStorageRepo(
  `${PREFIX}settings`,
);
