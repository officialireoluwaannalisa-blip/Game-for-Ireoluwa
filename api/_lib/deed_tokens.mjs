// Shared signed-deed helpers for the Island Deeds API.
// Deeds are HMAC-SHA256 signed JSON payloads: base64url(payload).base64url(sig)
// Signed tokens are mintable only server-side; clients can store and present
// them but cannot forge or alter them.
import crypto from "node:crypto";
import { getCatalogIsland, validateIslandName } from "../../shared/islandCatalog.mjs";

export function getDeedSecret() {
  return (
    process.env.ISLAND_DEED_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    null
  );
}

export function isTestMode() {
  return process.env.ISLAND_DEEDS_TEST_MODE === "1";
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY) || isTestMode();
}

function base64urlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "utf8");
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlDecodeToBuffer(b64) {
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signDeedPayload(payload) {
  const secret = getDeedSecret();
  if (!secret) throw new Error("Deed signing is not configured on this deployment.");
  const body = base64urlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(body).digest();
  return `${body}.${base64urlEncode(sig)}`;
}

export function verifyDeedToken(token) {
  const secret = getDeedSecret();
  if (!secret || typeof token !== "string" || token.length > 4096) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret).update(body).digest();
  let given;
  try {
    given = base64urlDecodeToBuffer(sig);
  } catch {
    return null;
  }
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  let payload;
  try {
    payload = JSON.parse(base64urlDecodeToBuffer(body).toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object" || payload.v !== 1) return null;
  const island = getCatalogIsland(payload.islandId);
  if (!island) return null;
  // Re-validate a custom name — named islands always use the catalog name.
  if (island.name) {
    payload.name = island.name;
  } else {
    const v = validateIslandName(payload.name);
    if (!v.ok) return null;
    payload.name = v.name;
  }
  return payload;
}

export function mintDeed({ islandId, name, sessionId }) {
  const island = getCatalogIsland(islandId);
  if (!island) throw new Error("Unknown island.");
  const payload = {
    v: 1,
    islandId,
    name,
    sid: sessionId || null,
    iat: Math.floor(Date.now() / 1000),
  };
  return {
    token: signDeedPayload(payload),
    islandId,
    name,
    sessionId: sessionId || null,
    boughtAt: payload.iat * 1000,
  };
}

// ── Tiny shared HTTP helpers (raw Node, Vercel + tsx dev server compatible) ──
export function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

export async function readJsonBody(req, maxBytes = 64 * 1024) {
  // Vercel pre-parses JSON bodies into req.body; the raw Node dev server does not.
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "object") return req.body;
    try {
      return JSON.parse(String(req.body));
    } catch {
      return null;
    }
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) return null;
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

export function getRequestOrigin(req) {
  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "localhost:3000").split(",")[0].trim();
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
  const protoHeader = String(req.headers?.["x-forwarded-proto"] || "").split(",")[0].trim();
  const proto = isLocal ? "http" : protoHeader || "https";
  return `${proto}://${host}`;
}

// Naive per-instance rate limit — good enough to stop casual abuse on a toy scale.
const buckets = new Map();
export function allowRequest(key, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  if (buckets.size > 4096) {
    for (const [k, b] of buckets) if (now - b.start > windowMs) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || now - b.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}
