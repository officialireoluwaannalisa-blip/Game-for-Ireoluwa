// POST /api/islands/checkout — create a Stripe Checkout Session for an island deed.
// Prices ALWAYS come from the shared catalog — never from the client.
// When ISLAND_DEEDS_TEST_MODE=1 the endpoint returns a synthetic local redirect
// instead of calling Stripe (development only, never set on production).
import Stripe from "stripe";
import {
  getCatalogIsland,
  resolvePurchaseName,
} from "../../shared/islandCatalog.mjs";
import {
  sendJson,
  readJsonBody,
  getRequestOrigin,
  isTestMode,
  allowRequest,
} from "../_lib/deed_tokens.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const ip = String(req.headers?.["x-forwarded-for"] || "local").split(",")[0].trim();
  if (!allowRequest(`checkout:${ip}`, 20)) {
    return sendJson(res, 429, { error: "Too many attempts — try again in a minute." });
  }

  const body = await readJsonBody(req);
  if (!body) return sendJson(res, 400, { error: "Invalid request body." });

  const island = getCatalogIsland(String(body.islandId || ""));
  if (!island) return sendJson(res, 404, { error: "Unknown island." });

  const resolved = resolvePurchaseName(island, body.customName);
  if (!resolved.ok) return sendJson(res, 400, { error: resolved.error });

  const playerName = String(body.playerName || "Explorer").replace(/[\r\n<>]/g, "").slice(0, 48) || "Explorer";
  const origin = getRequestOrigin(req);

  if (isTestMode()) {
    // One client code path: the app always returns with deed_session and
    // /api/islands/fulfill recognizes test_ sessions only in test mode.
    const encodedName = Buffer.from(resolved.name, "utf8").toString("base64url");
    return sendJson(res, 200, {
      url: `${origin}/?deed_session=test_${island.id}_${encodedName}#/islands`,
      testMode: true,
    });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return sendJson(res, 503, {
      error: "The Island Deed office is opening at launch — card payments are not configured on this deployment yet.",
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: island.priceCents,
            product_data: {
              name: `Island Deed — ${island.name || "Unnamed Isle"}`,
              description:
                `Your name on a deed to a ${island.diameterMeters}m volcanic-coral island ` +
                `(${Math.round(island.areaSqm)} m²) in the IREOLUWA Outer Shoals.`,
            },
          },
        },
      ],
      metadata: {
        island_id: island.id,
        island_name: resolved.name,
        player_name: playerName,
      },
      success_url: `${origin}/?deed_session={CHECKOUT_SESSION_ID}#/islands`,
      cancel_url: `${origin}/?deed_cancelled=1#/islands`,
    });
    return sendJson(res, 200, { url: session.url });
  } catch (err) {
    return sendJson(res, 502, { error: "Card payments are temporarily unavailable. Try again soon." });
  }
}
