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
- **In-world games** (`client/voxel/interactive_games.js`) — all thirteen: Naughts & Crosses, Connect Four, Whack-a-Mole, Floor Piano, Simon Memory Synth, Lights-Out Shrine, Step Sequencer, Streetball, Jackpot Automaton, Fireworks, Tesla Coil, Anti-Gravity Cottage and Marble Run. Every one is a seeded placement in the live world (two Tic-Tac-Toe tables), with an engine controller, hit boxes, AI opponents where applicable, per-game bests and a `Go there` shortcut in the Play menu. In Kids Mode the **Jackpot Automaton is hidden on purpose** (gambling-themed, so it never appears for kids); turn Kids Mode off with the top-left toggle and it plays normally.
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
- `STRIPE_SECRET_KEY` — Stripe secret key; switches the Island Deeds store to live card payments. Unset = the store renders but shows “opening at launch”.
- `ISLAND_DEED_SECRET` — signs Island Deed tokens (HMAC-SHA256). Falls back to `STRIPE_WEBHOOK_SECRET`, then `STRIPE_SECRET_KEY`. Any random 32+ byte string works (`openssl rand -hex 32`).
- `ISLAND_DEEDS_TEST_MODE` — `1` makes the store fulfil purchases locally with no payment (development only — **never set on production**).

## Island Deeds — the Outer Shoals (20 unlockable islands)

Beyond the main island lie **20 empty Outer Shoals islands** — different sizes
(72–256 m across, ~4,000–51,000 m² — the Crown Isle is nearly as wide as the
main island), arranged in two rings of ten, different biomes, and different one-time prices
(**$1.99 → $19.99**). Ten are named; the other ten are **Unnamed Isles** that the
buyer names at purchase. Islands start empty — owning the deed unlocks the usual
builder on that island (and only there; the main island stays free for everyone).

- **Buying** — the 🏝️ Deeds dock button opens the store. Checkout goes through
  an **embedded Stripe Checkout Form** (`ui_mode: "form"`, Stripe API
  `2026-03-25.dahlia`, `api/islands/checkout`) rendered inline in the Deeds checkout
  page — no redirect; prices ALWAYS come from the shared catalog
  (`shared/islandCatalog.mjs`), never from the client. `/api/islands/fulfill` verifies
  the payment with Stripe (`payment_status === "paid"`), reads the island from the
  product metadata, and mints a signed **deed token** (HMAC-SHA256);
  the client caches it in `localStorage` and verifies cached deeds against
  `api/islands/verify` on boot.
- **Naming** — Unnamed Isles are named by the buyer at checkout (validated on both
  client and server: 3–24 chars, no links, friendly-words list). Pre-named islands
  keep their Shoals name forever; Unnamed Isles can be re-signed to a new name
  anytime via `api/islands/rename`.
- **Portability** — deeds are signed tokens, so they travel: “Export my deeds”
  copies a deed code, and “Restore” on any device re-imports it. Real cross-device
  accounts (email login) are future work.
- **Kids Mode** — buying always passes a parent gate first (math question +
  press-and-hold confirm) before the secure form ever mounts.
- **Enforcement** — building is gated to the main island + islands you own
  (`canBuildAtIsland`); unowned islands show a for-sale toast and open the store.
  As with all client-side games, the gate is client-enforced; the money side is
  Stripe-verified.
- **Map** — everyone sees the 20 islands (locked) as voxel mounds with deed
  signposts; owners teleport via “Visit my island” in the store. Placement,
  walking and camera bounds all understand the union of islands.
- **Serverless on Vercel** — `api/islands/*` are Node serverless functions (raw
  `(req, res)` handlers, also mounted in the Node dev server, so `npm run dev`
  exercises the identical code path; set `ISLAND_DEEDS_TEST_MODE=1` for free local
  test purchases).

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
  voxel/islands.js    Procedural Outer Shoals islands + deed signposts/plaques
  island_deeds.js     Client store for Island Deeds (checkout, verify, rename, restore)
shared/islandCatalog.mjs  20-island catalog (single source of truth: client, dev server, serverless)
api/islands/          Serverless: config, checkout, fulfill, verify, rename (+ _lib/deed_tokens)
src/                  Server: world store, AI build pipeline, content policy, voxel audit
server.ts             Node server: API, WebSocket multiplayer, static serving
tests/                Unit tests (game rules, geometry, logic, island catalog, deed tokens)
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
