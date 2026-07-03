import type { TeaIconKey } from "@/lib/types";

/**
 * Hand-drawn-feel stroke icons for leaf shapes. All 24×24, stroked with
 * currentColor so they inherit the tea's liquor color.
 */
const PATHS: Record<TeaIconKey, React.ReactNode> = {
  leaf: (
    <>
      <path d="M12 20C6 16 5 9 7 4c5 1 11 4 10 11-.5 3.5-2.5 5-5 5z" />
      <path d="M9.5 16.5C10.5 12 12 9 14.5 6.5" />
    </>
  ),
  bud: (
    <>
      <path d="M12 21c-3.5-2-5-5.5-5-9 0-4 2.5-7 5-9 2.5 2 5 5 5 9 0 3.5-1.5 7-5 9z" />
      <path d="M12 21V8" />
    </>
  ),
  twist: (
    <>
      <path d="M7 3c3 3 1 6-1 9s-1 7 2 9" />
      <path d="M14 3c3 3 1 6-1 9s-1 7 2 9" />
    </>
  ),
  pearl: (
    <>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 6c1-1.5 2.5-2.5 4-3" />
      <path d="M9 11c.5 2 2 3.5 4 4" />
    </>
  ),
  strip: (
    <>
      <path d="M6 21C8 15 7 8 9 3" />
      <path d="M12 21c2-6 1-13 3-18" />
      <path d="M18 19c1.5-4.5 1-10 2.5-14" />
    </>
  ),
  cake: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18" strokeDasharray="2 3" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  brick: (
    <>
      <rect x="4" y="7" width="16" height="10" rx="1" />
      <path d="M4 12h16M12 7v5M8 12v5M16 12v5" />
    </>
  ),
  flower: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 9.5C10 7 10 4.5 12 3c2 1.5 2 4 0 6.5zM14.5 12c2.5-2 5-2 6.5 0-1.5 2-4 2-6.5 0zM12 14.5c2 2.5 2 5 0 6.5-2-1.5-2-4 0-6.5zM9.5 12C7 14 4.5 14 3 12c1.5-2 4-2 6.5 0z" />
    </>
  ),
  needle: (
    <>
      <path d="M8 21C8 14 9 7 12 3c3 4 4 11 4 18" />
      <path d="M12 21V8" />
    </>
  ),
};

export function TeaIcon({
  icon,
  className,
}: {
  icon: TeaIconKey;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {PATHS[icon]}
    </svg>
  );
}
