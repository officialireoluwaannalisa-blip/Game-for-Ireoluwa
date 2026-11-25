# IREOLUWA — The AI Voxel Island

IREOLUWA is an interactive 3D voxel island where anyone can sculpt creations with an AI
builder and explore them live together — and where kids can play, race, surf and **learn**.
Built with Three.js, Vite, a small Node server, and a procedural voxel engine.

## What's inside

- **3D island world** — procedural terrain, ocean, roads, interiors, vehicles, villagers, avatar system and first-person / pan / orbit cameras (`client/voxel/`).
- **Kids Mode** — safe filtering of creations, an explorer dock with subject categories, voice feedback and star rewards (`client/kids_mode.js`).
- **Learning Academy** (`client/learning_academy.js`) — a full curriculum-first learning system:
  - **5 subject tracks**: Maths, English, Logic & Memory, Science & Nature, World & Culture.
  - **3 age tiers**: Seedling (6–8), Explorer (9–11), Scholar (12+).
  - **5 activities**: Quiz Quest (adaptive questions with explanations), Memory Match (fact pairing), Number Rocket (timed mental maths), Word Wizard (unscrambling), Pattern Path (sequence logic).
  - **Persistent XP and levels per track** (Seedling → Sprout → Explorer → Scholar → Star Scholar → Island Sage → Grandmaster), streaks, accuracy tracking and a **daily Brilliance mission** (3 activities/day).
  - **Star rewards** feed Kids Mode; progress persists in `localStorage`. Works fully offline.
- **Arcade games** (`client/voxel/kids_arcade_games.js`) — Island Grand Prix (3 difficulty levels: Rookie Tour / Island Grand Prix / Storm Chase), Island Surfer (Subway-Surfers-style 3-lane runner) and Sky Balloon Pop.
- **In-world games** (`client/voxel/interactive_games.js`) — Naughts & Crosses, Connect Four, Whack-a-Mole, Floor Piano, Simon Memory Synth, Lights-Out Shrine, Step Sequencer, Streetball, and more — placed on the island itself.
- **Shared world** — AI-generated community buildings are vetted by a content policy and a spatial/voxel audit before they go live (`src/content_policy.ts`, `src/voxel_audit.ts`).
- **Static fallback** — on hosts without the Node backend, the build emits `world-snapshot.json` (policy-filtered bundled seed) so the full island and everyone's contributions render; live features degrade gracefully.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000 (Node server + Vite middleware)
```

Production-ish local run:

```bash
npm run build
npm start          # NODE_ENV=production tsx server.ts → http://localhost:3000
```

Static preview of the exact deployable bundle (no backend, like Vercel):

```bash
npm run build
npm run start:static   # http://localhost:4173
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with Vite middleware, API and WebSocket on :3000 |
| `npm run build` | Production build → `dist/` (also emits `world-snapshot.json`) |
| `npm start` | Production Node server (API + WebSocket + static `dist/`) |
| `npm run preview` | Vite preview of the built bundle |
| `npm run start:static` | Static-only preview on :4173 (mimics Vercel) |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm test` | Unit tests (node:test) |
| `npm run test:watch` | Unit tests in watch mode |

## Environment variables

See [`.env.example`](.env.example). The **static build needs no secrets** — it serves the
snapshot and runs every game/learning feature locally. The **live server** uses:

- `GEMINI_API_KEY` — server-side only; powers the AI builder and live board-game AI. Never shipped to the client.
- `WORLD_STATE_PATH` — where the shared world is persisted (default `./data/world-state.json`, gitignored). **Point this at a persistent volume in production.**
- `PORT` — listen port (default `3000`).

## Deployment

### Option A — Static (Vercel, current live setup)

`vercel.json` builds `dist/` and sets safe security headers + cache policy. The client:

1. Tries `/api/world` (fails fast, it's an SPA fallback),
2. Falls back to `/world-snapshot.json` — the island renders with the real contribution
   count, no failing `/api` or WebSocket calls are made,
3. Skips multiplayer and shared leaderboards entirely (they need the live server),
   while local bests, Kids Mode stars and the Learning Academy all work.

### Option B — Live Node host (recommended for the full experience)

Any host with a persistent filesystem + WebSocket support (Fly.io, Render, Railway,
a VPS). Build with `npm run build`, run `npm start`, set `WORLD_STATE_PATH` to a volume,
and put the host behind TLS. The client auto-detects liveness: if `/api/world` responds,
multiplayer and shared scores connect automatically.

### Health check

`GET /api/health` → `{ ok, status, uptimeSec, version, creations, now }`
Use it for uptime monitors and post-deploy smoke checks.

## Project layout

```
index.html            App shell (canvas HUD, dialogs, top bar)
public/styles.css     All styles
client/
  app.js              UI wiring, Play browser, leaderboards, spectate feed
  kids_mode.js        Kids Mode, safe filtering, explorer dock, stars
  learning_academy.js Curriculum + learning games (offline-first)
  games_catalogue.js  Single source of truth for the Play menu
  game_progress.js    Shared XP/bests/achievements store
  voxel/              Three.js engine, arcade games, in-world games, audio
src/                  Server: world store, AI build pipeline, content policy, voxel audit
server.ts             Node server: API, WebSocket multiplayer, static serving
tests/                Unit tests (game rules, geometry, logic)
```

## Quality gates & CI

GitHub Actions (`.github/workflows/ci.yml`) runs type-check, unit tests, production build
and validates that `dist/world-snapshot.json` is generated and non-empty. Add branch
protection to require it before merging.

## Safety & moderation

- Kids Mode is on by default and filters unsafe creations (slot machine, adult themes).
- All AI-built content passes a content policy (`src/content_policy.ts`) and an audit/repair
  pass (`src/voxel_audit.ts`) before placement.
- No free-text multiplayer chat; nicknames and avatars are sanitised; actions are rate-limited.
- Uploads are image-only and used solely to guide the AI build; terms links are shown in-app.
- No tracking cookies; visitor identity is a first-party random cookie used for daily build limits.

## Contributing

1. Branch from `main`, keep `npm run lint && npm test && npm run build` green.
2. New games: add to `CLIENT` catalogue (or `Learning Academy` activity), wire HUD/labels,
   keep Kids-Mode-safe content, and add a headless smoke check before shipping.
3. World seed changes (`src/data/live_world_seed.json`) are validated by the content policy
   and audit — run `npm run lint` after regenerating.
