"use client";

/**
 * A row of tiny tasting cups: filled = poured, ringed = current, faint =
 * still to come.
 */
export function SteepDots({
  total,
  current,
  completed,
  color,
}: {
  total: number;
  /** 0-based index of the steep on screen. */
  current: number;
  completed: number;
  color: string;
}) {
  return (
    <ol
      aria-label={`Steep ${current + 1} of ${total}, ${completed} poured`}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {Array.from({ length: total }, (_, i) => {
        const poured = i < completed;
        const isCurrent = i === current;
        return (
          <li
            key={i}
            className={`rounded-full transition-all duration-300 ${
              isCurrent ? "h-3.5 w-3.5" : "h-2.5 w-2.5"
            }`}
            style={{
              background: poured ? color : "transparent",
              boxShadow: isCurrent
                ? `inset 0 0 0 2px ${color}`
                : poured
                  ? "none"
                  : "inset 0 0 0 1.5px var(--line)",
            }}
          />
        );
      })}
    </ol>
  );
}
