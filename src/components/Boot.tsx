"use client";

import { useEffect } from "react";
import { useSettings } from "@/store/settings";
import { useProfiles } from "@/store/profiles";
import { useLog } from "@/store/log";
import { useStash } from "@/store/stash";

/**
 * Client bootstrap: hydrate stores from localStorage, keep the theme class
 * in sync, register the service worker.
 */
export function Boot() {
  const theme = useSettings((s) => s.theme);
  const language = useSettings((s) => s.language);
  const hydrated = useSettings((s) => s.hydrated);

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

  return null;
}
