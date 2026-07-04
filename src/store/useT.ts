import { STRINGS, type Lang } from "@/lib/i18n";
import { useSettings } from "./settings";

/** Current language + its string table, reactive to the settings store. */
export function useT() {
  const lang: Lang = useSettings((s) => s.language);
  return { t: STRINGS[lang], lang };
}
