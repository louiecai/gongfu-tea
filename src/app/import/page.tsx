"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { decodeProfile } from "@/lib/share";
import { useProfiles } from "@/store/profiles";
import { TeaIcon } from "@/components/TeaIcon";
import { formatSeconds } from "@/lib/timer";
import { CATEGORY_LABELS } from "@/lib/types";

function ImportInner() {
  const params = useSearchParams();
  const router = useRouter();
  const encoded = params.get("p") ?? "";
  const tea = useMemo(() => decodeProfile(encoded), [encoded]);
  const [imported, setImported] = useState(false);

  if (!tea) {
    return (
      <div className="pt-20 text-center">
        <p className="text-muted">
          This share link is missing or malformed — ask for a fresh one.
        </p>
        <Link href="/" className="mt-3 inline-block font-semibold underline">
          Back to teas
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
        A tea, shared with you
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
      <h1 className="font-display mt-4 text-3xl font-medium">{tea.name}</h1>
      {tea.chineseName && <p className="mt-1 text-muted">{tea.chineseName}</p>}
      <p className="mt-3 text-sm text-muted">
        {CATEGORY_LABELS[tea.category]} · {tea.tempC}°C ·{" "}
        {tea.ratioGramsPer100ml} g/100 ml
      </p>
      <p className="mt-1.5 text-sm text-muted">
        {tea.steepsSec.length} steeps:{" "}
        {tea.steepsSec.map((s) => formatSeconds(s)).join(" → ")}
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <button
          onClick={accept}
          disabled={imported}
          className="rounded-full px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
          style={{ background: tea.liquorColor }}
        >
          {imported ? "Added ✓" : "Add to my shelf"}
        </button>
        <Link
          href="/"
          className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-muted hover:text-ink"
        >
          No thanks
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
