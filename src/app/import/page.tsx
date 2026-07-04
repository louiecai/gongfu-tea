"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { decodeProfile } from "@/lib/share";
import { useProfiles } from "@/store/profiles";
import { TeaIcon } from "@/components/TeaIcon";
import { formatSeconds } from "@/lib/timer";
import { categoryLabel, teaNames } from "@/lib/i18n";
import { useT } from "@/store/useT";

function ImportInner() {
  const params = useSearchParams();
  const router = useRouter();
  const encoded = params.get("p") ?? "";
  const tea = useMemo(() => decodeProfile(encoded), [encoded]);
  const [imported, setImported] = useState(false);
  const { t, lang } = useT();

  if (!tea) {
    return (
      <div className="pt-20 text-center">
        <p className="text-muted">{t.badLink}</p>
        <Link href="/" className="mt-3 inline-block font-semibold underline">
          {t.backToTeas}
        </Link>
      </div>
    );
  }

  const accept = () => {
    useProfiles.getState().save(tea);
    setImported(true);
    setTimeout(() => router.push("/"), 900);
  };

  return (
    <div className="mx-auto max-w-sm pt-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {t.importEyebrow}
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
        {teaNames(tea, lang).primary}
      </h1>
      {teaNames(tea, lang).secondary && (
        <p className="mt-1 text-muted">{teaNames(tea, lang).secondary}</p>
      )}
      <p className="mt-3 text-sm text-muted">
        {categoryLabel(tea.category, lang)} · {tea.tempC}°C ·{" "}
        {tea.ratioGramsPer100ml} g/100 ml
      </p>
      <p className="mt-1.5 text-sm text-muted">
        {t.importMeta(tea.steepsSec.length)}
        {tea.steepsSec.map((s) => formatSeconds(s)).join(" → ")}
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <button
          onClick={accept}
          disabled={imported}
          className="rounded-full px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
          style={{ background: tea.liquorColor }}
        >
          {imported ? t.added : t.addToShelf}
        </button>
        <Link
          href="/"
          className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-muted hover:text-ink"
        >
          {t.noThanks}
        </Link>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={null}>
      <ImportInner />
    </Suspense>
  );
}
