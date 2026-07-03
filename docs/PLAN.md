# Gongfu Tea Timer — Design & Implementation Plan

## Context

Louie wants a website that is a collection of gongfu-cha (kung fu tea) steep timers. Each tea has a multi-steep schedule; the app tracks which steep you're on, times each steep, alerts on finish, and advances to the next steep (waiting for a tap to start it, matching the real pour-and-drink rhythm). It ships with a rich named-tea preset library plus custom profiles, in a minimal, wholesome, animated UI colored by tea liquor, working on mobile and desktop as an installable PWA.

New greenfield project. Location: `/home/louie/Documents/gongfu-tea-timer` (name changeable).

## Decisions (confirmed with user)

- **Stack**: Next.js (App Router) + TypeScript + Tailwind + Zustand + Framer Motion + Serwist (PWA)
- **Persistence**: localStorage now, behind a repository interface so a backend (optional login/sync) can bolt on later
- **Alerts on steep end**: sound chime + browser notification + vibration (mobile) + visual — all toggleable in Settings
- **Auto-advance**: steep N ends → alert → app advances to steep N+1 ready → user taps Start when pouring again. Per-profile toggle to disable advancing (stay on steep until manually advanced).
- **Presets**: big named-tea library (~24 teas: Longjing, Bi Luo Chun, Huangshan Maofeng, Anji Bai Cha, Silver Needle, White Peony, Shou Mei, Junshan Yinzhen, Tieguanyin, Gaoshan, Dancong, Da Hong Pao, Rou Gui, Shui Xian, Dong Ding, Jin Jun Mei, Keemun, Dianhong, Lapsang, Sheng Pu-erh (young/aged), Shou Pu-erh, Liu Bao, Chrysanthemum/herbal)
- **PWA**: installable, offline-capable
- **v1 extras (all approved)**: brew log + tasting notes; strength preference (global lighter/stronger scaler) + ±5s mid-steep nudge; tea stash tracker (grams remaining, decrement per session); share custom profile via URL-encoded link
- **Included by default**: dark mode, water temp + leaf/water ratio shown on session screen, profile JSON export/import

## Architecture

```
src/
  app/                    # Next.js App Router
    page.tsx              # Home: tea grid
    session/[teaId]/page.tsx  # Timer session
    profiles/             # custom profile list + editor
    log/page.tsx          # brew log
    stash/page.tsx        # tea stash
    settings/page.tsx
    import/page.tsx       # ?p=<encoded> shared-profile landing
  lib/
    teas.ts               # preset library (typed data)
    types.ts              # TeaProfile, SteepSchedule, BrewSession, StashItem…
    timer.ts              # timestamp-based timer engine
    repo/                 # repository interface + localStorage impl
    audio.ts              # Web Audio chime (unlocked on first Start tap)
    alerts.ts             # notification + vibration helpers
    share.ts              # profile <-> URL codec (base64url JSON)
  store/                  # Zustand stores: session, settings, profiles, log, stash
  components/             # TimerRing, SteepDots, TeaCard, TeaIcon, editors…
```

### Key technical points

- **Timer engine**: timestamp-based (`endsAt = Date.now() + remainingMs`), display via `requestAnimationFrame`; never decrement a counter on interval — survives tab throttling/sleep. Pause stores `remainingMs`. Steep-end detection compares against `Date.now()` on each frame + a backup `setTimeout`.
- **Strength scaler**: multiplier (e.g. 0.8×–1.3×) applied to schedule at session start; ±5s nudge adjusts current steep only.
- **Repository interface**: `ProfileRepo`, `LogRepo`, `StashRepo`, `SettingsRepo` with a `LocalStorageRepo` implementation. Backend later = new impl, zero UI change.
- **Wake Lock API**: keep screen on while a steep runs (feature-detected).
- **Audio autoplay**: `AudioContext` created/resumed inside the Start button handler — always allowed.
- **Notifications**: permission requested only when user flips the toggle in Settings.
- **PWA**: Serwist service worker, manifest with icons, offline precache of app shell + tea data (all local, no external requests at runtime).

## Data model (core)

```ts
type TeaCategory = 'green'|'white'|'yellow'|'oolong-light'|'oolong-dark'|'black'|'puer-sheng'|'puer-shou'|'heicha'|'herbal';

interface TeaProfile {
  id: string; name: string; chineseName?: string;
  category: TeaCategory;
  liquorColor: string;        // hex, drives ring/animations
  icon: string;               // key into TeaIcon SVG set
  tempC: number; ratioGramsPer100ml: number;
  steepsSec: number[];        // e.g. [10,15,20,25,35,45,60,90]
  autoAdvance: boolean;       // default true
  custom?: boolean;
}

interface BrewSession { id; teaId; startedAt; steepsCompleted; rating?; note?; gramsUsed?; }
interface StashItem   { teaId|customId; gramsRemaining; gramsPerSession; }
```

## UI / design direction

Minimal, warm, wholesome. Soft cream/charcoal backgrounds (light + dark), generous whitespace, rounded cards, one accent = the selected tea's liquor color. Big central circular timer ring that drains and "fills with tea" (gradient of liquorColor). Steep position shown as a row of dots (done / current / upcoming). Custom inline SVG icons per category (leaf, bud, gaiwan, rolled pearl, pressed cake, flower). Framer Motion page/card transitions; gentle glow pulse on steep completion. Use the `frontend-design` skill during implementation for the visual pass.

## Implementation steps

1. **Scaffold**: `create-next-app` (TS, Tailwind, App Router) in `gongfu-tea-timer/`; add zustand, framer-motion, serwist. `git init`.
2. **Types + tea library**: `types.ts`, `teas.ts` with ~24 curated presets (schedules per category norms, liquor colors, icons).
3. **Repo layer + stores**: localStorage repos, Zustand stores, hydration-safe (Next SSR ⇒ read localStorage only client-side).
4. **Timer engine + session screen**: TimerRing, SteepDots, start/pause/skip/±5s, auto-advance flow, wake lock.
5. **Alerts**: chime (Web Audio, small synthesized gong — no asset needed), notification, vibration, settings toggles.
6. **Home grid + tea cards + icons**: category-grouped grid, search/filter.
7. **Custom profiles**: editor (name, category, color, temp, ratio, steep list editor), export/import JSON, share-link codec + import page.
8. **Brew log**: auto-record session on finish/abandon, rating + note editor, list view.
9. **Stash**: stash list, grams decrement on session start (uses profile ratio), low-stash hint.
10. **Settings + strength slider**, dark mode (system + manual toggle).
11. **PWA**: manifest, icons, Serwist config, offline test.
12. **Visual polish pass** with `frontend-design` skill; responsive check mobile + desktop.

## Verification

- `npm run build` clean; `npm run dev` and drive with Playwright MCP: pick tea → start steep → let finish → verify auto-advance waits for tap; test pause, ±5s, skip.
- Verify timer accuracy after backgrounding tab (timestamp math).
- Test chime fires after user-gesture unlock; notification permission flow; settings toggles persist.
- Create custom profile → export → share link → open import page → profile imported.
- Brew log entry created with rating/note; stash grams decrement.
- Lighthouse PWA installability check; offline reload works.
- Mobile viewport (390px) + desktop layouts via Playwright screenshots.

## Out of scope (later)

Backend accounts/sync (repo interface ready), i18n, ambient sounds.
