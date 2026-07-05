"use client";

import { useEffect } from "react";
import { useSettings } from "@/store/settings";
import { useProfiles } from "@/store/profiles";
import { useLog } from "@/store/log";
import { useStash } from "@/store/stash";
import { useActiveSessions } from "@/store/activeSessions";

/**
 * Client bootstrap: hydrate stores from localStorage, keep the theme class
 * in sync, register the service worker.
 */
export function Boot() {
  const theme = useSettings((s) => s.theme);
  const language = useSettings((s) => s.language);
  const hydrated = useSettings((s) => s.hydrated);
  const activeCount = useActiveSessions((s) => s.sessions.length);

  useEffect(() => {
    if (hydrated) {
      document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    }
  }, [language, hydrated]);

  useEffect(() => {
    useSettings.getState().hydrate();
    useProfiles.getState().hydrate();
    useLog.getState().hydrate();
    useStash.getState().hydrate();
    useActiveSessions.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark =
        theme === "dark" || (theme === "system" && media.matches);
      root.classList.toggle("dark", dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, hydrated]);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  // Reflect how many brews are currently unfinished on the app icon, where
  // the browser supports it (Chrome/Edge, some Android). No-ops elsewhere.
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (count?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (activeCount > 0) {
      void nav.setAppBadge?.(activeCount);
    } else {
      void nav.clearAppBadge?.();
    }
  }, [activeCount]);

  return null;
}
