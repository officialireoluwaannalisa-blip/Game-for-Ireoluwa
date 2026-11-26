// IREOLUWA Island Deeds — client-side store for Outer Shoals island purchases.
//
// Money never touches this client: the browser redirects to Stripe Checkout
// (created by /api/islands/checkout) and receives a signed deed token from
// /api/islands/fulfill after Stripe confirms the payment. Deeds are cached in
// localStorage; each carries an HMAC signature minted server-side, so editing
// localStorage cannot forge a deed that passes verification.
//
// Deeds are portable: the success screen shows a one-time Deed Code (the
// token bundle) that can be restored on another device via "Restore deeds".
// Island ownership gates building on that island — the main island stays
// free, and owned islands unlock the same builder everyone already uses.
//
// Kids Mode: purchases pass through a parent gate (math challenge + hold to
// confirm) before the Stripe redirect. When Stripe keys are not configured on
// the deployment (or ISLAND_DEEDS_TEST_MODE is on) the UI reflects that.

import {
  ISLANDS,
  getCatalogIsland,
  resolvePurchaseName,
  validateIslandName,
  formatPrice,
} from "../shared/islandCatalog.mjs";

export { ISLANDS, getCatalogIsland, formatPrice, validateIslandName };

const DEEDS_KEY = "geminisland_island_deeds_v2";
const PENDING_KEY = "geminisland_island_deed_pending_v1";

const memoryStore = { deeds: null, verified: false };

function storage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // blocked storage
  }
  return null;
}

function loadDeeds() {
  if (memoryStore.deeds) return memoryStore.deeds;
  const store = storage();
  let raw = null;
  try {
    raw = store?.getItem(DEEDS_KEY) ?? null;
  } catch {
    raw = null;
  }
  let parsed = [];
  try {
    parsed = raw ? JSON.parse(raw) : [];
  } catch {
    parsed = [];
  }
  memoryStore.deeds = Array.isArray(parsed) ? parsed.filter((d) => d && typeof d === "object" && d.token && d.islandId) : [];
  return memoryStore.deeds;
}

function saveDeeds() {
  const store = storage();
  try {
    store?.setItem(DEEDS_KEY, JSON.stringify(memoryStore.deeds));
  } catch {
    // quota — keep in-memory
  }
}

export function getDeeds() {
  return loadDeeds().map((d) => ({
    ...d,
    island: getCatalogIsland(d.islandId),
  }));
}

export function getOwnedIslandIds() {
  return new Set(getDeeds().map((d) => d.islandId));
}

export function getDeedForIsland(islandId) {
  return getDeeds().find((d) => d.islandId === islandId) || null;
}

export function isIslandOwned(islandId) {
  return getDeeds().some((d) => d.islandId === islandId);
}

export function getIslandDisplayName(island) {
  const deed = getDeedForIsland(island.id);
  return deed?.name || island.name || "Unnamed Isle";
}

/** The build rule: the main island is free; outer islands require a deed. */
export function canBuildAtIsland(x, z, islandList = ISLANDS) {
  for (const island of islandList) {
    if (Math.hypot(x - island.x, z - island.z) <= island.radius + 6.5) {
      if (isIslandOwned(island.id)) return { ok: true, island };
      return { ok: false, island };
    }
  }
  return { ok: true, island: null };
}

function apiBase() {
  // Relative URL — works on the Vercel deployment and on the Node dev server.
  return "";
}

async function readJson(res) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return body;
}

export async function fetchIslandConfig() {
  try {
    const res = await fetch(`${apiBase()}/api/islands/config`, { headers: { Accept: "application/json" } });
    const body = await readJson(res);
    if (!res.ok || !body) return { enabled: false, testMode: false, error: body?.error || `Store responded ${res.status}` };
    return { enabled: Boolean(body.enabled), testMode: Boolean(body.testMode) };
  } catch (err) {
    return { enabled: false, testMode: false, error: err?.message || "Island store unreachable" };
  }
}

/** Verify cached deeds against the server; drops anything the server rejects. */
export async function verifyDeedsWithServer() {
  if (memoryStore.verified) return getDeeds();
  const deeds = loadDeeds();
  if (!deeds.length) {
    memoryStore.verified = true;
    return [];
  }
  try {
    const res = await fetch(`${apiBase()}/api/islands/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ tokens: deeds.map((d) => d.token) }),
    });
    const body = await readJson(res);
    if (res.ok && Array.isArray(body?.valid)) {
      const validIslands = new Set(body.valid.map((d) => d.islandId));
      memoryStore.deeds = deeds.filter((d) => validIslands.has(d.islandId));
      saveDeeds();
    }
  } catch {
    // Offline or API absent — keep cached deeds rather than yanking a player's island.
  }
  memoryStore.verified = true;
  return getDeeds();
}

/**
 * Start a purchase. Caller is responsible for the kids parent gate before
 * invoking this. Returns {ok, redirectUrl?, error?}.
 */
export async function beginIslandPurchase(islandId, customName, playerName) {
  const island = getCatalogIsland(islandId);
  if (!island) return { ok: false, error: "Unknown island." };
  if (isIslandOwned(islandId)) return { ok: false, error: "You already own this island." };
  const resolved = resolvePurchaseName(island, customName);
  if (!resolved.ok) return resolved;

  // Remember what the buyer was naming so the return page can confirm it.
  try {
    storage()?.setItem(PENDING_KEY, JSON.stringify({ islandId, name: resolved.name, at: Date.now() }));
  } catch {
    // non-fatal
  }

  try {
    const res = await fetch(`${apiBase()}/api/islands/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ islandId, customName: resolved.customName, playerName: String(playerName || "").slice(0, 48) }),
    });
    const body = await readJson(res);
    if (!res.ok || !body?.url) {
      return { ok: false, error: body?.error || `Could not start checkout (${res.status}).` };
    }
    return { ok: true, redirectUrl: body.url, name: resolved.name };
  } catch (err) {
    return { ok: false, error: err?.message || "Could not reach the island store." };
  }
}

function storeDeedPayload(payload) {
  const deeds = loadDeeds();
  const existing = deeds.findIndex((d) => d.islandId === payload.islandId);
  const record = {
    token: payload.token,
    islandId: payload.islandId,
    name: payload.name,
    sessionId: payload.sessionId || null,
    boughtAt: payload.boughtAt || Date.now(),
  };
  if (existing >= 0) deeds[existing] = record;
  else deeds.push(record);
  memoryStore.deeds = deeds;
  saveDeeds();
  return record;
}

/** Called on load when the URL carries ?deed_session=... after Stripe redirect. */
export async function fulfillPendingPurchase(sessionId) {
  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 200) {
    return { ok: false, error: "Missing checkout session." };
  }
  try {
    const res = await fetch(`${apiBase()}/api/islands/fulfill?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { Accept: "application/json" },
    });
    const body = await readJson(res);
    if (!res.ok || !body?.deed) {
      return { ok: false, error: body?.error || `The island store could not confirm your payment (${res.status}).` };
    }
    const record = storeDeedPayload(body.deed);
    try {
      storage()?.removeItem(PENDING_KEY);
    } catch {
      // non-fatal
    }
    const island = getCatalogIsland(record.islandId);
    return { ok: true, island, name: record.name, deedCode: record.token };
  } catch (err) {
    return { ok: false, error: err?.message || "Could not confirm the purchase." };
  }
}

export function getPendingPurchase() {
  try {
    const raw = storage()?.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingPurchase() {
  try {
    storage()?.removeItem(PENDING_KEY);
  } catch {
    // non-fatal
  }
}

/** Rename a deed you own. Server re-signs the deed with the new name. */
export async function renameOwnedIsland(islandId, newName) {
  const deed = getDeedForIsland(islandId);
  if (!deed) return { ok: false, error: "You don't own this island yet." };
  const v = validateIslandName(newName);
  if (!v.ok) return v;
  try {
    const res = await fetch(`${apiBase()}/api/islands/rename`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token: deed.token, newName: v.name }),
    });
    const body = await readJson(res);
    if (!res.ok || !body?.deed) {
      return { ok: false, error: body?.error || `Rename failed (${res.status}).` };
    }
    const record = storeDeedPayload(body.deed);
    return { ok: true, name: record.name, token: record.token };
  } catch (err) {
    return { ok: false, error: err?.message || "Could not reach the island store." };
  }
}

/** Export/Import deed bundles so islands can move between devices. */
export function exportDeedBundle() {
  const deeds = loadDeeds();
  return deeds.map((d) => d.token).join("~");
}

export function importDeedBundle(bundle) {
  const tokens = String(bundle || "").split("~").map((t) => t.trim()).filter(Boolean);
  if (!tokens.length) return { ok: false, error: "Paste a deed code first." };
  const added = [];
  for (const token of tokens) {
    const parts = token.split(".");
    if (parts.length !== 2) continue;
    try {
      const b64 = parts[0].replace(/-/g, "+").replace(/_/g, "/");
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const payload = JSON.parse(new TextDecoder().decode(bytes));
      if (!payload?.islandId || !getCatalogIsland(payload.islandId)) continue;
      if (isIslandOwned(payload.islandId)) continue;
      const deeds = loadDeeds();
      deeds.push({
        token,
        islandId: payload.islandId,
        name: payload.name || null,
        sessionId: payload.sid || null,
        boughtAt: (payload.iat || 0) * 1000 || Date.now(),
      });
      memoryStore.deeds = deeds;
      saveDeeds();
      added.push(payload.islandId);
    } catch {
      // skip bad token
    }
  }
  void verifyDeedsWithServer();
  return { ok: true, added: added.length };
}
