"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Each bottom-nav tab keeps its own scroll position, like a native app's tab
 * bar, instead of resetting to the top every time you switch back to it.
 * Paired with `scroll={false}` on the Nav links, which otherwise fight this
 * by asking Next to scroll to top on every tab switch.
 */
const positions = new Map<string, number>();

export function ScrollRestoration() {
  const pathname = usePathname();
  const current = useRef(pathname);

  useEffect(() => {
    window.scrollTo(0, positions.get(pathname) ?? 0);
    current.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => positions.set(current.current, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
