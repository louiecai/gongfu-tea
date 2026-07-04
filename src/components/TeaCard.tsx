"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { TeaProfile } from "@/lib/types";
import { TeaIcon } from "./TeaIcon";
import { formatSeconds } from "@/lib/timer";
import { teaNames } from "@/lib/i18n";
import { useT } from "@/store/useT";

export function TeaCard({ tea, index }: { tea: TeaProfile; index: number }) {
  const { t, lang } = useT();
  const names = teaNames(tea, lang);
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.35 }}
    >
      <Link
        href={`/session/${tea.id}`}
        className="group flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-[var(--lift)]"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{
            color: tea.liquorColor,
            background: `color-mix(in srgb, ${tea.liquorColor} 16%, transparent)`,
          }}
        >
          <TeaIcon icon={tea.icon} className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="font-display truncate text-[15px] font-medium">
              {names.primary}
            </span>
            {names.secondary && (
              <span className="shrink-0 text-xs text-muted">
                {names.secondary}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            {t.cardMeta(
              tea.steepsSec.length,
              formatSeconds(tea.steepsSec[0]),
              tea.tempC,
            )}
          </span>
        </span>
        {/* Tasting-cup dot: a sip of the liquor color. */}
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-inset ring-black/5 transition-transform group-hover:scale-125 dark:ring-white/10"
          style={{ background: tea.liquorColor }}
        />
      </Link>
    </motion.li>
  );
}
