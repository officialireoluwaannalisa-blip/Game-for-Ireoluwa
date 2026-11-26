// Shared IREOLUWA Archipelago catalog.
// Single source of truth imported by the browser client, the Node dev server
// and the Vercel serverless functions in /api — keep it dependency-free.
//
// 20 purchasable islands, different sizes (radius, meters) and different
// prices (USD cents). Ten islands are named; ten are "Unnamed Isles" whose
// buyer names them at purchase time.

export const ISLAND_CATALOG_VERSION = 1;

export const ISLANDS = [
  { id: "isle-driftwood-pod", name: null, priceCents: 199, radius: 14, angleDeg: 40, distance: 262, biome: "meadow_clover", blurb: "A tiny clover pocket just off the north-east shore." },
  { id: "isle-pelican-rock", name: "Pelican Rock", priceCents: 249, radius: 13, angleDeg: 12, distance: 226, biome: "sandy_shore", blurb: "A sun-warmed sandbar crusted with white coral." },
  { id: "isle-mist-nook", name: null, priceCents: 299, radius: 15, angleDeg: 88, distance: 268, biome: "misty_moss", blurb: "Quiet moss gardens beneath a permanent sea mist." },
  { id: "isle-turtleback-cay", name: "Turtleback Cay", priceCents: 349, radius: 16, angleDeg: 66, distance: 233, biome: "sandy_shore", blurb: "Gentle shallows and leaning sea-oat dunes." },
  { id: "isle-clover-shelf", name: null, priceCents: 399, radius: 18, angleDeg: 118, distance: 306, biome: "meadow_clover", blurb: "Clover flats perfect for a kite meadow." },
  { id: "isle-bramble-hollow", name: "Bramble Hollow", priceCents: 449, radius: 19, angleDeg: 148, distance: 343, biome: "autumn_grove", blurb: "Amber groves that drop golden leaves year-round." },
  { id: "isle-frost-hollow", name: null, priceCents: 499, radius: 21, angleDeg: 172, distance: 312, biome: "snow_frost", blurb: "A snow-dusted hollow that never fully thaws." },
  { id: "isle-emberlight", name: "Emberlight Isle", priceCents: 549, radius: 22, angleDeg: 196, distance: 356, biome: "volcanic_basalt", blurb: "Smouldering basalt with glowing cracks." },
  { id: "isle-plaza-reach", name: null, priceCents: 599, radius: 23, angleDeg: 224, distance: 322, biome: "stone_plaza", blurb: "A flat stone shelf begging for a grand plaza." },
  { id: "isle-sunchaser", name: "Sunchaser Isle", priceCents: 649, radius: 24, angleDeg: 252, distance: 369, biome: "desert_mesa", blurb: "Red rock mesas that blaze at golden hour." },
  { id: "isle-fern-bank", name: null, priceCents: 699, radius: 26, angleDeg: 282, distance: 473, biome: "meadow_clover", blurb: "A wide grassy bank with room for whole worlds." },
  { id: "isle-howling-gale", name: "Howling Gale", priceCents: 749, radius: 28, angleDeg: 305, distance: 428, biome: "misty_moss", blurb: "Wind-combed cliffs with mossy leeward hollows." },
  { id: "isle-ash-drift", name: null, priceCents: 799, radius: 30, angleDeg: 330, distance: 505, biome: "volcanic_basalt", blurb: "Ash dunes and quiet obsidian flats." },
  { id: "isle-silvermist", name: "Silvermist Isle", priceCents: 899, radius: 32, angleDeg: 18, distance: 546, biome: "snow_frost", blurb: "Glacial pools and shimmering white ridges." },
  { id: "isle-amber-grove", name: null, priceCents: 999, radius: 34, angleDeg: 285, distance: 626, biome: "autumn_grove", blurb: "A rolling autumn forest the colour of honey." },
  { id: "isle-auric-shoal", name: "Auric Shoal", priceCents: 1099, radius: 36, angleDeg: 340, distance: 452, biome: "sandy_shore", blurb: "Golden sandbars and the clearest snorkel shallows." },
  { id: "isle-market-crown", name: null, priceCents: 1299, radius: 38, angleDeg: 205, distance: 561, biome: "stone_plaza", blurb: "A civic-sized stone crown for a grand market town." },
  { id: "isle-embermaw", name: "Embermaw Atoll", priceCents: 1499, radius: 40, angleDeg: 132, distance: 621, biome: "volcanic_basalt", blurb: "A smouldering crater ringed by black sand." },
  { id: "isle-red-mesa", name: null, priceCents: 1699, radius: 40, angleDeg: 242, distance: 521, biome: "desert_mesa", blurb: "A vast desert plateau of towering red mesas." },
  { id: "isle-crown", name: "IREOLUWA Crown Isle", priceCents: 1999, radius: 46, angleDeg: 78, distance: 691, biome: "meadow_clover", blurb: "The jewel of the archipelago — the biggest buildable isle of all." },
].map((isl, index) => {
  const rad = (isl.angleDeg * Math.PI) / 180;
  return Object.freeze({
    ...isl,
    index,
    x: Math.round(Math.sin(rad) * isl.distance * 10) / 10,
    z: Math.round(Math.cos(rad) * isl.distance * 10) / 10,
    diameterMeters: Math.round(isl.radius * 2),
    areaSqm: Math.round(Math.PI * isl.radius * isl.radius),
  });
});

export const ISLAND_COUNT = ISLANDS.length;

export function getCatalogIsland(id) {
  return ISLANDS.find((isl) => isl.id === id) || null;
}

export function formatPrice(priceCents) {
  const cents = Math.max(0, Math.floor(Number(priceCents) || 0));
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Buyer name validation (shared client/server) ────────────────────────────
const NAME_BLOCKLIST = [
  "fuck", "shit", "bitch", "cunt", "nazi", "hitler", "porn", "sex", "rape", "slut", "dick", "pussy",
];

export function validateIslandName(raw) {
  const clean = String(raw ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (clean.length < 3) return { ok: false, error: "Give your island at least 3 characters." };
  if (clean.length > 24) return { ok: false, error: "Keep the name under 24 characters." };
  if (/https?:|www\.|\.com\b|\.gg\b|\.net\b/i.test(clean)) {
    return { ok: false, error: "No web links in island names." };
  }
  const flat = clean.toLowerCase().replace(/[^a-z]/g, "");
  for (const word of NAME_BLOCKLIST) {
    if (flat.includes(word)) return { ok: false, error: "Please choose a friendlier name." };
  }
  if (!/[a-z0-9]/i.test(clean)) return { ok: false, error: "Add at least one letter or number." };
  return { ok: true, name: clean };
}

/** Validate the buyer-facing purchase payload on both client and server. */
export function resolvePurchaseName(island, customName) {
  if (island.name) return { ok: true, name: island.name, customName: null };
  const v = validateIslandName(customName);
  if (!v.ok) return v;
  return { ok: true, name: v.name, customName: v.name };
}
