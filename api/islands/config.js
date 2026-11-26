// GET /api/islands/config — tells the client whether the island store can take payments.
import { sendJson, isStripeConfigured, isTestMode } from "../_lib/deed_tokens.mjs";

export default function handler(_req, res) {
  sendJson(res, 200, { enabled: isStripeConfigured(), testMode: isTestMode() });
}
