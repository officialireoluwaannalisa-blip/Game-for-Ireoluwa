// GET /api/islands/config — tells the client whether the island store can take payments.
import { sendJson, isStripeConfigured, isTestMode } from "../_lib/deed_tokens.mjs";

export default function handler(_req, res) {
  const testMode = isTestMode();
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || null;
  // The embedded Checkout Form cannot mount without the publishable key.
  const enabled = testMode || (isStripeConfigured() && Boolean(publishableKey));
  sendJson(res, 200, { enabled, testMode, publishableKey });
}
