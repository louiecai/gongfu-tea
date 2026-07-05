# 一盏茶 · A Cup's Time

A quiet gongfu-cha steep timer, steep by steep. Pick a tea, and it times each
pour on that tea's own schedule, alerts you when a steep is done, and waits for
your tap before the next one — matching the real pour-and-drink rhythm. Ships
with a named-tea preset library, custom profiles, a brew log, and a leaf stash
tracker. Installable PWA; works offline on phone and desktop.

## Features

- **Preset library** — ~24 named teas (Longjing, Tieguanyin, Da Hong Pao,
  Sheng/Shou Pu-erh, Silver Needle, and more), each with its own steep
  schedule, water temperature, and leaf-to-water ratio.
- **Custom profiles** — build your own tea, or share one via a URL-encoded link.
- **Session timer** — per-steep countdown colored by the tea's liquor; chime,
  notification, and vibration alerts; keeps the screen awake mid-steep.
- **Smarter brewing** — global strength scaler + ±5s mid-steep nudge, saved
  vessel profiles, optional rinse/wake-up steep, and a "brew again" shortcut
  from any log entry.
- **Insights** — brew log with tasting notes, ratings, favorites, search/sort,
  a stats card, and a brew-calendar heatmap.
- **Tea stash** — grams remaining per tea, decremented automatically each brew.
- **Always with you** — app-icon badge, home-screen shortcuts, background
  "still brewing" notifications, and a pop-out picture-in-picture timer
  (Chrome desktop).
- **Polish** — light/dark/system themes, English + 中文, full backup/restore,
  undo-after-delete, keyboard shortcuts, and screen-reader announcements.

## Tech stack

Next.js 16 (App Router, static export) · React 19 · TypeScript · Tailwind v4 ·
Zustand · Framer Motion. Persistence is localStorage behind a repository
interface, so a sync backend can bolt on later. No server — it's a fully
static PWA hosted on GitHub Pages.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Command         | Does                     |
| --------------- | ------------------------ |
| `npm run dev`   | Dev server               |
| `npm run build` | Static export to `out/`  |
| `npm run start` | Serve a production build |
| `npm run lint`  | Lint                     |
| `npm run test`  | Run the Vitest suite     |

## Deploy

`npm run build` emits a static site to `out/`. It's served on GitHub Pages via
the workflow in `.github/`. Because there's no Node server (`output: "export"`),
all data lives in the browser — nothing is uploaded.

## Project layout

```
src/
  app/         # routes: home, session, profiles, log, stash, settings, import
  lib/         # teas, types, timer engine, audio/alerts, i18n, repo
  store/       # Zustand stores: session, settings, profiles, log, stash
  components/  # TimerCup, TeaIcon, ProfileEditor, Boot, nav
public/        # manifest, icons, service worker
docs/PLAN.md   # design & implementation notes
```
