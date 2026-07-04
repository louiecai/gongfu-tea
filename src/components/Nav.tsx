"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/store/useT";

export function Nav() {
  const pathname = usePathname();
  const { t } = useT();
  const TABS = [
    { href: "/", label: t.navTeas, glyph: "茶" },
    { href: "/log", label: t.navLog, glyph: "记" },
    { href: "/stash", label: t.navStash, glyph: "藏" },
    { href: "/settings", label: t.navSettings, glyph: "调" },
  ];
  // The session screen is a focused, full-attention view — hide the tabs.
  if (pathname === "/session") return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-sm md:inset-x-auto md:left-1/2 md:top-auto md:bottom-4 md:w-auto md:-translate-x-1/2 md:rounded-full md:border md:px-2 md:shadow-lg md:shadow-[var(--lift)]"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around md:gap-1 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/" || pathname.startsWith("/profiles")
              : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 px-5 py-2.5 text-[11px] font-semibold tracking-wide transition-colors md:flex-row md:gap-2 md:text-xs ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <span
                  aria-hidden
                  className={`font-display text-lg leading-none md:text-base ${
                    active ? "" : "opacity-60"
                  }`}
                >
                  {tab.glyph}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
