// GET /api/islands/fulfill?session_id=... — confirm payment, mint the signed island deed.
// In test mode (ISLAND_DEEDS_TEST_MODE=1) a synthetic session id of the form
//   test_<islandId>_<base64url(name)>
// is accepted and fulfilled without calling Stripe.
import Stripe from "stripe";
import {
  getCatalogIsland,
  validateIslandName,
} from "../../shared/islandCatalog.mjs";
import {
  sendJson,
  mintDeed,
  isTestMode,
  allowRequest,
} from "../_lib/deed_tokens.mjs";

function fulfillFromMetadata(islandIdRaw, nameRaw, sessionId) {
  const island = getCatalogIsland(String(islandIdRaw || ""));
  if (!island) return { error: "Unknown island.", status: 404 };
  let name;
  if (island.name) {
    name = island.name;
  } else {
    const v = validateIslandName(nameRaw);
    if (!v.ok) return { error: v.error, status: 400 };
    name = v.name;
  }
  return { deed: mintDeed({ islandId: island.id, name, sessionId }) };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });
  const ip = String(req.headers?.["x-forwarded-for"] || "local").split(",")[0].trim();
  if (!allowRequest(`fulfill:${ip}`, 30)) {
    return sendJson(res, 429, { error: "Too many attempts — try again in a minute." });
  }

  const url = new URL(req.url || "/", "http://localhost");
  const sessionId = String(url.searchParams.get("session_id") || "").slice(0, 200);
  if (!sessionId) return sendJson(res, 400, { error: "Missing session_id." });

  if (sessionId.startsWith("test_")) {
    if (!isTestMode()) return sendJson(res, 403, { error: "Test purchases are disabled." });
    const match = /^test_([a-z0-9-]+)_(.+)$/.exec(sessionId);
    if (!match) return sendJson(res, 400, { error: "Malformed test session." });
    let decodedName = "";
    try {
      decodedName = Buffer.from(match[2], "base64url").toString("utf8");
    } catch {
      // fall through to validation error below
    }
    const result = fulfillFromMetadata(match[1], decodedName, sessionId);
    if (result.error) return sendJson(res, result.status || 400, { error: result.error });
    return sendJson(res, 200, { deed: result.deed, testMode: true });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return sendJson(res, 503, { error: "Card payments are not configured on this deployment yet." });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session?.payment_status === "paid" ||
      (session?.status === "complete" && session?.payment_status === "no_payment_required");
    if (!paid) {
      return sendJson(res, 402, { error: "That checkout has not been paid yet." });
    }
    const meta = session.metadata || {};
    const result = fulfillFromMetadata(meta.island_id, meta.island_name, session.id);
    if (result.error) return sendJson(res, result.status || 400, { error: result.error });
    return sendJson(res, 200, { deed: result.deed });
  } catch (err) {
    return sendJson(res, 502, { error: "Could not confirm the payment with Stripe." });
  }
}
