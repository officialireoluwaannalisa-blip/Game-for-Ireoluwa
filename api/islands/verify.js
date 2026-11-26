// POST /api/islands/verify — verify a batch of deed tokens; returns the ones that check out.
import {
  sendJson,
  readJsonBody,
  verifyDeedToken,
  allowRequest,
} from "../_lib/deed_tokens.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const ip = String(req.headers?.["x-forwarded-for"] || "local").split(",")[0].trim();
  if (!allowRequest(`verify:${ip}`, 20)) {
    return sendJson(res, 429, { error: "Too many attempts — try again in a minute." });
  }

  const body = await readJsonBody(req);
  const tokens = Array.isArray(body?.tokens) ? body.tokens.slice(0, 24) : [];
  const valid = [];
  for (const token of tokens) {
    const payload = verifyDeedToken(token);
    if (payload) {
      valid.push({ islandId: payload.islandId, name: payload.name, boughtAt: (payload.iat || 0) * 1000 });
    }
  }
  return sendJson(res, 200, { valid });
}
