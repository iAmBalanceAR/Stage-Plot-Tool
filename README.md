# StageCraft

StageCraft is a local-first stage plot builder for bands. Open the site and start plotting. No login. Lay out the stage, fill the input list, and export a multi-page PDF technical packet, a PNG plot, CSV, or an editable project file.

Working plots autosave in the current browser. User-facing instructions are in [USER-GUIDE.md](./USER-GUIDE.md).

## What you get

- Opens on the editor with no sign-in
- Drag, resize, rotate, duplicate, label, and arrow-key nudge stage objects
- Full [Tecrider stage-plot icon](https://tecrider.com/stage-plot-icons) set plus compact SVG basics
- Plot library in this browser
- Templates: full band, power trio, acoustic duo, blank
- Input/patch list with mic, DI, stand, phantom, performer, destination
- Monitor mixes and production notes
- PDF technical packet, PNG plot, CSV input list, StageCraft JSON backup
- Light/dark theme, desktop and phone layouts

## Stack

- Next.js 15 (App Router, Turbopack) and React 19
- TypeScript, Tailwind CSS 4, Zustand, Zod
- jsPDF and html-to-image for export
- PNPM (not npm)

There is no required database. A `supabase/migrations` SQL file exists for a possible future hosted backend. You can ignore it.

The old venue-login and band-link system is kept under `archive/login-system/` and is not used.

## Requirements

- Node.js 20 or newer
- PNPM 9 or newer (`corepack enable` is the usual way to get it)

## Install

```bash
git clone <your-repo-url>
cd Stage-Plot-Tool
corepack enable
pnpm install
```

## Run in development

```bash
pnpm dev
```

Open `http://localhost:3000`. The editor loads immediately.

## Run in production

```bash
pnpm build
pnpm start
```

`pnpm start` listens on port 3000. Put a reverse proxy (Caddy, nginx, IIS) in front if you want HTTPS and a real hostname.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Next.js listen port when using `pnpm start` |

## How data is stored

| Data | Where | Notes |
| --- | --- | --- |
| Current plot and library | Browser `localStorage` | Tied to that browser on that device |
| PDF / PNG / CSV / `.stagecraft.json` | Downloaded files | The hand-off when people are not on the same computer |

If you build a plot on a phone and later open the site on a laptop, you will **not** see the phone’s draft unless you exported the editable project and imported it.

## Scripts

```bash
pnpm dev            # development server
pnpm build          # production build
pnpm start          # serve the production build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
```

## Project layout

```text
archive/login-system/ archived venue login and band-link flow
public/icons/tecrider Tecrider PNG icons
src/app/              App Router pages
src/components/       editor, canvas, menus
src/data/             equipment catalog and templates
src/lib/              export, project parse, local plot library
src/store/            Zustand stores
src/types/            StageProject types
```

## Keyboard

| Key | Action |
| --- | --- |
| Drag | Move an object |
| Arrow keys | Nudge the selected object |
| Delete / Backspace | Remove the selected object |
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Y or Shift+Ctrl/Cmd+Z | Redo |
| Ctrl/Cmd+S | Download the editable project file |

Audience is drawn at the **bottom** of the stage. Stage left is the band’s left when facing the crowd.

Stage-plot icon artwork is from [Tecrider](https://tecrider.com/stage-plot-icons).
