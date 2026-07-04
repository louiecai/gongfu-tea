"use client";

/**
 * The signature element: a porcelain cup seen from above. The liquor rises
 * with a drifting wave as the steep progresses, while a hairline ring
 * counts the time down. Everything else on the screen stays quiet.
 */

const RING_R = 104;
const CUP_R = 88;
const LIQUID_R = 84;
const CIRC = 2 * Math.PI * RING_R;

// One wave segment is 220 wide; the path repeats it so a 220px translate
// loops seamlessly.
const WAVE_D =
  "M0,12 Q27.5,2 55,12 T110,12 T165,12 T220,12 T275,12 T330,12 T385,12 T440,12 V240 H0 Z";

export function TimerCup({
  progress,
  color,
  ripple,
  idle,
  children,
}: {
  /** 0 → empty cup, 1 → full (elapsed fraction of the steep). */
  progress: number;
  color: string;
  /** Pulse rings outward (steep just finished). */
  ripple?: boolean;
  /** Waiting for the first tap — gives the ring a gentle "come start me" pulse. */
  idle?: boolean;
  children?: React.ReactNode;
}) {
  const p = Math.min(1, Math.max(0, progress));
  // Liquid surface: from just above the cup bottom to fully at the rim. The
  // wave path (see WAVE_D) dips as low as +12 from its own reference point,
  // so the travel distance overshoots the rim by that much — otherwise the
  // wave's troughs leave a visible gap at 100% even though its crests reach.
  const surfaceY = 110 + LIQUID_R - 8 - p * (2 * LIQUID_R + 8);
  const ringOffset = CIRC * p;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[320px]">
      <svg viewBox="0 0 220 220" className="h-full w-full">
        <defs>
          <clipPath id="cup-clip">
            <circle cx="110" cy="110" r={LIQUID_R} />
          </clipPath>
        </defs>

        {/* countdown ring */}
        <circle
          cx="110"
          cy="110"
          r={RING_R}
          fill="none"
          stroke="var(--line)"
          strokeWidth="2"
        />
        <circle
          cx="110"
          cy="110"
          r={RING_R}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={ringOffset}
          transform="rotate(-90 110 110)"
          className={idle ? "ring-idle-pulse" : undefined}
          style={{ transition: "stroke-dashoffset 0.3s linear" }}
        />

        {/* porcelain */}
        <circle
          cx="110"
          cy="110"
          r={CUP_R}
          fill="var(--surface)"
          stroke="var(--line)"
          strokeWidth="1.5"
        />

        {/* liquor */}
        <g clipPath="url(#cup-clip)">
          <g style={{ transform: `translateY(${surfaceY}px)`, transition: "transform 0.4s ease" }}>
            <g className="wave-drift-slow">
              <path d={WAVE_D} fill={color} opacity="0.45" />
            </g>
            <g className="wave-drift">
              <path d={WAVE_D} fill={color} opacity="0.85" transform="translate(0,4)" />
            </g>
          </g>
        </g>

        {/* rim highlight */}
        <circle
          cx="110"
          cy="110"
          r={LIQUID_R}
          fill="none"
          stroke="var(--bg)"
          strokeWidth="3"
          opacity="0.6"
        />
      </svg>

      {ripple && (
        <>
          <span
            aria-hidden
            className="steep-glow pointer-events-none absolute inset-[-10%] rounded-full"
            style={{ background: `radial-gradient(circle, ${color}4d, transparent 70%)` }}
          />
          <span
            aria-hidden
            className="steep-ripple absolute inset-[6%] rounded-full border-2"
            style={{ borderColor: color }}
          />
          <span
            aria-hidden
            className="steep-ripple absolute inset-[6%] rounded-full border-2"
            style={{ borderColor: color, animationDelay: "0.8s" }}
          />
        </>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center rounded-2xl bg-surface/70 px-5 py-2.5 text-center backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
