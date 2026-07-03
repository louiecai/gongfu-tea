"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PRESET_TEAS } from "@/lib/teas";
import { CATEGORY_LABELS, type TeaCategory, type TeaProfile } from "@/lib/types";
import { useProfiles } from "@/store/profiles";
import { TeaCard } from "@/components/TeaCard";

const CATEGORY_ORDER: TeaCategory[] = [
  "green",
  "yellow",
  "white",
  "oolong-light",
  "oolong-dark",
  "black",
  "puer-sheng",
  "puer-shou",
  "heicha",
  "herbal",
];

export default function HomePage() {
  const custom = useProfiles((s) => s.custom);
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (t: TeaProfile) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      (t.chineseName ?? "").includes(q) ||
      CATEGORY_LABELS[t.category].toLowerCase().includes(q);

    const byCategory = CATEGORY_ORDER.map((cat) => ({
      cat,
      teas: PRESET_TEAS.filter((t) => t.category === cat && matches(t)),
    })).filter((g) => g.teas.length > 0);

    return { byCategory, customTeas: custom.filter(matches) };
  }, [query, custom]);

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          工夫茶 · gongfu cha
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium">
          What are we steeping?
        </h1>
      </header>

      <div className="mb-6 flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teas…"
          aria-label="Search teas"
          className="w-full rounded-full border border-line bg-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-muted focus:outline-none"
        />
        <Link
          href="/profiles/new"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-muted"
        >
          <span aria-hidden className="text-base leading-none">＋</span>
          New tea
        </Link>
      </div>

      {groups.customTeas.length > 0 && (
        <section className="mb-7">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
              Your teas
            </h2>
            <Link
              href="/profiles"
              className="text-xs font-semibold text-muted hover:text-ink"
            >
              Manage
            </Link>
          </div>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {groups.customTeas.map((tea, i) => (
              <TeaCard key={tea.id} tea={tea} index={i} />
            ))}
          </ul>
        </section>
      )}

      {groups.byCategory.map(({ cat, teas }) => (
        <section key={cat} className="mb-7">
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
            {CATEGORY_LABELS[cat]}
          </h2>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {teas.map((tea, i) => (
              <TeaCard key={tea.id} tea={tea} index={i} />
            ))}
          </ul>
        </section>
      ))}

      {groups.byCategory.length === 0 && groups.customTeas.length === 0 && (
        <p className="mt-16 text-center text-sm text-muted">
          No tea matches “{query}”. Try another name, or create it as a new
          tea.
        </p>
      )}
    </div>
  );
}
