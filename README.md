# StageCraft

StageCraft is a local-first stage plot builder for bands. A venue signs in, creates a unique link for each act, and texts that link. The band opens it, lays out the stage, fills the input list, and sends a frozen snapshot back. StageCraft also exports a multi-page PDF technical packet, a PNG plot, CSV, and an editable project file.

This is not a cloud SaaS. Venue logins live in a JSON file on the machine that runs the app. Band slots live in a second JSON file. Working plots autosave in the current browser. Pick a host that keeps those files on disk.

User-facing instructions (no setup jargon) are in [USER-GUIDE.md](./USER-GUIDE.md).

## What you get

- Drag, resize, rotate, duplicate, label, and arrow-key nudge stage objects
- To-scale equipment drawings (kit, amps, wedges, stands) instead of generic boxes
- Venue owner accounts plus unique band links (`/b/……`)
- Band links that stop working the day after the show date
- Plot library (per signed-in user, this browser)
- Venue inbox of frozen submissions, with a red unread count
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

## Requirements

- Node.js 20 or newer
- PNPM 9 or newer (`corepack enable` is the usual way to get it)
- A machine that can keep writing to `data/accounts.json` and `data/bands.json` (a PC, VPS, or similar). Ephemeral hosts such as default Vercel/Netlify deploys will lose band links and account edits.

## Install

```bash
git clone <your-repo-url>
cd Stage-Plot-Tool
corepack enable
pnpm install
```

## Create the venue login file

Venue accounts are **not** created in the UI. You edit `data/accounts.json`. That file ships in the repo with a starter venue login:

- Email: `test@test.com`
- Password: `testpass`

Change that password before anyone else can reach the site. To add more venues, copy a user / organization / membership block and give each new id. `data/accounts.example.json` is a second copy of the same shape.

Open `data/accounts.json` and change at least:

| Field | Where | What to put |
| --- | --- | --- |
| `email` | `users[]` | The address the venue types at sign-in |
| `password` | `users[]` | Plain text. This app is intentionally simple, not a bank. |
| `displayName` | `users[]` | Name shown in the header |
| `accountType` | `users[]` | `venue_owner` |
| `name` | `organizations[]` | Venue or room name |
| `inviteCode` | `organizations[]` | Short code if staff will join later (letters/numbers) |
| `ownerId` | `organizations[]` | Must match that user’s `id` |
| `orgId` / `userId` | `memberships[]` | Must point at the same org and user |
| `role` | `memberships[]` | `owner` for the venue login |

Keep the example `id` values if you only have one venue. For a second venue, give the new user, organization, and membership **new unique ids** (any UUID is fine):

```bash
node -e "console.log(crypto.randomUUID())"
```

These passwords are plain text in the repo. Treat `testpass` as a throwaway.

Staff: either add another user with `"accountType": "staff"` and a membership row, or sign them in as a venue account and use **Join** with the room’s invite code.

## Band data file

`data/bands.json` starts empty. After a venue is signed in, they use **Band links** in the app and that file is updated. On hosts without a persistent disk (including default Vercel), those writes do not last. `data/bands.example.json` is only a shape reference.

Each band record has a `linkToken`. The public URL is:

```text
https://your-domain.example/b/<linkToken>
```

Locally that is `http://localhost:3000/b/<linkToken>`. The link works through the show date and is refused the next calendar day. The venue can also turn a link off early.

## Run in development

```bash
pnpm dev
```

Open `http://localhost:3000`.

- Venue: sign in with the email/password from `data/accounts.json`
- Band: do **not** use that form. Open the unique `/b/…` link

## Run in production

On the same kind of always-on machine:

```bash
pnpm build
pnpm start
```

`pnpm start` listens on port 3000. Put a reverse proxy (Caddy, nginx, IIS) in front if you want HTTPS and a real hostname. Band texts will use whatever origin the venue’s browser shows when they copy the link, so the public URL must be the one acts can actually open.

Optional environment variables (defaults shown):

| Variable | Default | Purpose |
| --- | --- | --- |
| `STAGECRAFT_ACCOUNTS_FILE` | `<cwd>/data/accounts.json` | Override venue login file path |
| `STAGECRAFT_BANDS_FILE` | `<cwd>/data/bands.json` | Override band-slot file path |
| `PORT` | `3000` | Next.js listen port when using `pnpm start` |

The process needs permission to create and update those JSON files.

## How data is stored

| Data | Where | Notes |
| --- | --- | --- |
| Venue logins, rooms, memberships | `data/accounts.json` | Edited by you; some venue UI actions also write it |
| Band slots and link tokens | `data/bands.json` | Written by the venue **Band links** UI |
| Working plots, library, inbox snapshots | Browser `localStorage` | Tied to that browser on that device |
| PDF / PNG / CSV / `.stagecraft.json` / `.submission.json` | Downloaded files | The hand-off when people are not on the same computer |

If the band builds a plot on a phone and later opens the same link on a laptop, they will **not** see the phone’s draft unless they exported the editable project and imported it. If the venue and the band do not share a browser, the venue should import the downloaded `.submission.json` into **Inbox**.

Passwords are stored in plain text on purpose. Treat the `data/` folder like a shared office password list: limit who can read the server disk.

## Daily venue workflow (short)

1. Sign in at the site root.
2. **Band links** → band name + show date → **Create band link**.
3. Copy the URL and text/email it.
4. When the act is done, **Inbox** shows a red count until you open the snapshot.
5. Export PDF/PNG from the opened snapshot if you want paper or a graphic.

Details for venue staff and bands: [USER-GUIDE.md](./USER-GUIDE.md).

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
data/                 accounts.json, bands.json, and *.example.json
src/app/              App Router pages and /api/accounts, /api/bands
src/app/b/[token]     unique band link
src/components/       editor, canvas, menus, login
src/data/             equipment catalog and templates
src/lib/              accounts/bands files, export, workspace rules
src/store/            Zustand stores
src/types/            StageProject and account types
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
