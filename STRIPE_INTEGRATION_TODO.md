# Island Deeds — Stripe Integration TODO

This is the single source of truth for what Stripe needs to go live on
**game-for-ireoluwa.vercel.app**. The code is complete; the steps below are all
configuration, no code changes.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [.env.example](.env.example) — local development template
- Vercel project settings → Environment Variables (production + preview)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| `STRIPE_SECRET_KEY` | *(empty)* | Your Stripe secret key (`sk_live_…` for production, `sk_test_…` for testing) from https://dashboard.stripe.com/apikeys |
| `STRIPE_PUBLISHABLE_KEY` | *(empty)* | Your Stripe publishable key (`pk_live_…` / `pk_test_…`) — served to the browser by `/api/islands/config` to mount the embedded form |
| `mode` | `payment` | Set to `"payment"` for one-time charges (current, correct for island deeds) or `"subscription"` for recurring billing. |
| `line_items[].price` | *(none — dynamic `price_data` is used instead of pre-created Price IDs)* | Optionally create real Products/Prices in the Dashboard (https://dashboard.stripe.com/prices) and switch `line_items` to `{ price: "price_…", quantity: 1 }`. Not required — `price_data` with the catalog price is fully supported. |
| `ISLAND_DEEDS_TEST_MODE` | *(unset)* | Keep **unset on production**. Set to `1` only in local development for free fake purchases. |

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [api/islands/checkout.js](api/islands/checkout.js)

| Parameter | Value |
|-----------|-------|
| `ui_mode` | `form` (embedded Checkout Form — no redirect to Stripe) |
| `mode` | `payment` (one-time purchase) |
| `billing_address_collection` | `auto` |
| `phone_number_collection` | `{ enabled: false }` |
| `automatic_tax` | `{ enabled: false }` |
| `submit_type` | `auto` |
| `name_collection` | `{ individual: { enabled: true, optional: true } }` |
| `saved_payment_method_options` | `{ payment_method_save: "enabled" }` |
| `integration_identifier` | `custom_embedded_web_0001` |
| `payment_method_collection` | *(intentionally omitted — only valid for `mode: "subscription"`)* |

API version: `2026-03-25.dahlia` (server SDK `stripe@^23`); Stripe.js loaded from
`https://js.stripe.com/dahlia/stripe.js` in `index.html`. `STRIPE_PUBLISHABLE_KEY`
is **server-read** (no `VITE_` prefix needed — it reaches the browser via
`/api/islands/config`); `STRIPE_SECRET_KEY` never leaves the server.

## Notes on implementation choices

- **`metadata` / `success_url` / `cancel_url` were removed** from the
  `checkout.sessions.create(...)` call per the Studio field intents (they are no
  longer configured). The deed data (island id, chosen name, player name) now
  travels inside `line_items[].price_data.product_data.metadata` — still real,
  dynamic values, never client-supplied. `/api/islands/fulfill` reads it back
  with `listLineItems(..., { expand: ["data.price.product"] })` after confirming
  `payment_status === "paid"`. Legacy session-level `metadata` is still honored
  as a fallback so sessions created before this change keep working.
- **No redirect**: the embedded form renders inside the Deeds checkout page
  (`#island-checkout-dialog`). After `actions.confirm(...)` resolves, the client
  calls `/api/islands/fulfill?session_id=…` which verifies the payment with
  Stripe and mints the signed HMAC deed. No webhook is required for the happy
  path (the in-page flow confirms synchronously); adding
  `checkout.session.completed` → fulfillment webhook later is an optional
  belt-and-braces step.
- **Kids Mode parent gate** is unchanged — it runs before the embedded form is
  ever mounted.

## Setup and next steps

1. **Set the env vars** on Vercel (production + preview):
   ```
   STRIPE_SECRET_KEY=sk_live_…
   STRIPE_PUBLISHABLE_KEY=pk_live_…
   ```
   Until both are set, the store stays in its designed "opening at launch"
   state — the UI renders, nobody can be charged, no errors surface to players.
   `ISLAND_DEED_SECRET` is already configured (it signs deed tokens).
2. **Local development**: `cp .env.example .env`, fill `ISLAND_DEEDS_TEST_MODE=1`
   (free fake buys), or `pk_test_…`/`sk_test_…` for the real embedded form
   end-to-end.
3. **Testing**: with test keys, use Stripe's test cards —
   `4242 4242 4242 4242` (any future expiry, any CVC) succeeds;
   `4000 0000 0000 9995` is declined. Confirm flow: Deeds dock → card →
   Buy → parent gate → embedded form → deed appears in the store + island
   unlocks instantly.
4. **How the integration works**: `POST /api/islands/checkout` creates the
   session server-side (prices always come from `shared/islandCatalog.mjs`) →
   client mounts the embedded form with the returned `client_secret` →
   `form.on("confirm")` + `actions.confirm({ formConfirmEvent })` → on success
   the client calls `GET /api/islands/fulfill?session_id=…` → server retrieves
   the session, requires `payment_status === "paid"`, reads the island from the
   product metadata, mints an HMAC-SHA256 deed → deed is cached locally and
   re-verified on every boot via `/api/islands/verify`.
5. **Project structure of new/changed files**:
   - `api/islands/checkout.js` — creates the dahlia form session (Scenario A edit)
   - `api/islands/fulfill.js` — verifies payment + mints deed (line-items metadata)
   - `api/islands/config.js` — reports `enabled` + `publishableKey`
   - `client/app.js` — embedded-form mount + land/purchase flow (`STRIPE_CHECKOUT_APPEARANCE`)
   - `client/island_deeds.js` — config/purchase wrappers (returns `clientSecret`)
   - `index.html` — dahlia Stripe.js + `#island-checkout-dialog` (glass/clay)
   - `public/styles.css` — glassmorphism shell + claymorphism island card
6. **Next steps / product work**: create Stripe Products per island (optional —
   `price_data` works fine), add a `checkout.session.completed` webhook for
   redundancy, analytics on deed purchases, email receipt (Stripe can send
   these automatically: Dashboard → Settings → Emails), tax registration if
   `automatic_tax` is ever wanted (would flip the fixed-by-ui flag), and
   re-enable `payment_method_collection` only if islands ever become
   subscriptions.

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
- Embedded form (Checkout Form SDK): https://docs.stripe.com/checkout/embedded/custom-form
