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

/**
 * A page with no more content than fits the viewport shouldn't offer a
 * scroll affordance (rubber-band bounce on mobile, a phantom scrollbar on
 * desktop) — lock it. Measured off #app-shell (min-height, never itself
 * clipped) rather than <html>/<body>, which the lock class constrains.
 */
function fitsViewport(): boolean {
  const shell = document.getElementById("app-shell");
  return !!shell && shell.scrollHeight <= window.innerHeight;
}

export function ScrollRestoration() {
  const pathname = usePathname();
  const current = useRef(pathname);

  useEffect(() => {
    const applyLock = () => {
      const locked = fitsViewport();
      document.documentElement.classList.toggle("no-scroll", locked);
      return locked;
    };

    const raf = requestAnimationFrame(() => {
      const locked = applyLock();
      if (!locked) window.scrollTo(0, positions.get(pathname) ?? 0);
    });
    current.current = pathname;

    const shell = document.getElementById("app-shell");
    const ro = shell ? new ResizeObserver(() => applyLock()) : null;
    if (shell) ro?.observe(shell);
    window.addEventListener("resize", applyLock);
    void document.fonts?.ready.then(applyLock);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", applyLock);
    };
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => positions.set(current.current, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
