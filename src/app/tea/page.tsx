"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { findTea, useProfiles } from "@/store/profiles";
import { TeaIcon } from "@/components/TeaIcon";
import { formatSeconds } from "@/lib/timer";
import { categoryLabel, teaNames } from "@/lib/i18n";
import { useT } from "@/store/useT";

function TeaDetailsInner() {
  const id = useSearchParams().get("id") ?? "";
  const custom = useProfiles((s) => s.custom);
  const hydrated = useProfiles((s) => s.hydrated);
  const { t, lang } = useT();
  const tea = findTea(id, custom);

  if (!hydrated) return null;
  if (!tea) {
    return (
      <div className="pt-20 text-center">
        <p className="text-muted">{t.teaNotFound}</p>
        <Link href="/" className="mt-3 inline-block font-semibold underline">
          {t.backToTeas}
        </Link>
      </div>
    );
  }

  const names = teaNames(tea, lang);

  return (
    <div className="mx-auto max-w-sm pt-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {t.detailsEyebrow}
      </p>
      <span
        className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          color: tea.liquorColor,
          background: `color-mix(in srgb, ${tea.liquorColor} 16%, transparent)`,
        }}
      >
        <TeaIcon icon={tea.icon} className="h-10 w-10" />
      </span>
      <h1 className="font-display mt-4 text-3xl font-medium">
        {names.primary}
      </h1>
      {names.secondary && <p className="mt-1 text-muted">{names.secondary}</p>}
      <p className="mt-3 text-sm text-muted">
        {categoryLabel(tea.category, lang)} · {tea.tempC}°C ·{" "}
        {tea.ratioGramsPer100ml} g/100 ml
      </p>
      <p className="mt-1.5 text-sm text-muted">
        {t.importMeta(tea.steepsSec.length)}
        {tea.steepsSec.map((s) => formatSeconds(s)).join(" → ")}
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link
          href={`/session?tea=${tea.id}`}
          className="rounded-full px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
          style={{ background: tea.liquorColor }}
        >
          {t.brew}
        </Link>
        <Link
          href={`/profiles/new?clone=${tea.id}`}
          className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-muted hover:text-ink"
        >
          {t.cloneAndCustomize}
        </Link>
      </div>
    </div>
  );
}

export default function TeaDetailsPage() {
  return (
    <Suspense fallback={null}>
      <TeaDetailsInner />
    </Suspense>
  );
}
