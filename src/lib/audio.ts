/**
 * Synthesized meditation-bell chime via Web Audio — no asset file needed.
 * The AudioContext is created/resumed inside a user gesture (the Start
 * button), which satisfies autoplay policies.
 */

let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function playChime(): void {
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.5, now);
  master.connect(ctx.destination);

  // A bell is a fundamental plus slightly inharmonic partials that decay
  // at different rates.
  const partials: Array<[freq: number, gain: number, decay: number]> = [
    [523.25, 0.6, 2.8], // C5 fundamental
    [1046.5, 0.25, 2.0],
    [1567.98, 0.12, 1.4],
    [2093.0, 0.06, 1.0],
  ];

  for (const [freq, gain, decay] of partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + decay + 0.1);
  }
}
