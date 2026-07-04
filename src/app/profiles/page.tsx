"use client";

import { useState } from "react";
import Link from "next/link";
import { useProfiles } from "@/store/profiles";
import { encodeProfile } from "@/lib/share";
import { TeaIcon } from "@/components/TeaIcon";
import { teaNames } from "@/lib/i18n";
import { useT } from "@/store/useT";

export default function ProfilesPage() {
  const custom = useProfiles((s) => s.custom);
  const hydrated = useProfiles((s) => s.hydrated);
  const { t, lang } = useT();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const share = async (id: string) => {
    const tea = custom.find((t) => t.id === id);
    if (!tea) return;
    const url = `${window.location.origin}/import?p=${encodeProfile(tea)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${tea.name} — gongfu profile`, url });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t.shelfEyebrow}
          </p>
          <h1 className="font-display mt-1 text-3xl font-medium">
            {t.shelfTitle}
          </h1>
        </div>
        <Link
          href="/profiles/new"
          className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-muted"
        >
          ＋ {t.newTea}
        </Link>
      </header>

      {hydrated && custom.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="text-sm text-muted">{t.shelfEmpty}</p>
          <Link
            href="/profiles/new"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-bg"
          >
            {t.createFirst}
          </Link>
        </div>
      )}

      <ul className="space-y-2.5">
        {custom.map((tea) => (
          <li
            key={tea.id}
            className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5"
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
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-[15px] font-medium">
                {teaNames(tea, lang).primary}{" "}
                {teaNames(tea, lang).secondary && (
                  <span className="text-xs font-normal text-muted">
                    {teaNames(tea, lang).secondary}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted">
                {t.profileMeta(tea.steepsSec.length, tea.tempC)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5 text-xs font-semibold">
              <Link
                href={`/session?tea=${tea.id}`}
                className="rounded-full px-3 py-2 text-white"
                style={{ background: tea.liquorColor }}
              >
                {t.brew}
              </Link>
              <button
                onClick={() => share(tea.id)}
                className="rounded-full border border-line px-3 py-2 text-muted hover:text-ink"
              >
                {copiedId === tea.id ? t.copied : t.share}
              </button>
              <Link
                href={`/profiles/edit?id=${tea.id}`}
                className="rounded-full border border-line px-3 py-2 text-muted hover:text-ink"
              >
                {t.edit}
              </Link>
              {confirmingId === tea.id ? (
                <button
                  onClick={() => useProfiles.getState().remove(tea.id)}
                  className="rounded-full bg-red-700 px-3 py-2 text-white"
                >
                  {t.sure}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setConfirmingId(tea.id);
                    setTimeout(() => setConfirmingId(null), 2500);
                  }}
                  className="rounded-full border border-line px-3 py-2 text-muted hover:text-red-700"
                >
                  {t.del}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
