// Accessible ground rule for the whole archipelago.
//
// Geometry alone (meadow_engine's union SDF) knows every island's coastline so
// rendering, beaches and signposts work for everyone. MOVEMENT and PLACEMENT
// are stricter: the main IREOLUWA island is always walkable; an Outer Shoals
// island only counts as ground while the player owns a confirmed deed to it
// (HMAC-signed token minted by /api/islands/fulfill after Stripe reports the
// payment as paid). Unowned islands behave as water — you cannot walk, drive,
// wander, build or "accidentally swim" onto one.
//
// One shared implementation so the first-person controller, cars, vehicles,
// villagers, flyers and the AI spot-picker all agree.

import { ISLANDS, getIslandById } from "./islands.js";
import { isIslandOwned } from "../island_deeds.js";

const ISLAND_HALF_EXTENT = 163.5;
const ISLAND_SUPERELLIPSE_EXP = 3.1;

export function getMainIslandMarginLocal(x, z) {
  const ax = Math.abs(x) / ISLAND_HALF_EXTENT;
  const az = Math.abs(z) / ISLAND_HALF_EXTENT;
  const superDist =
    Math.pow(
      Math.pow(ax, ISLAND_SUPERELLIPSE_EXP) + Math.pow(az, ISLAND_SUPERELLIPSE_EXP),
      1 / ISLAND_SUPERELLIPSE_EXP,
    ) * ISLAND_HALF_EXTENT;
  const theta = Math.atan2(z, x);
  const warp =
    9.2 * Math.cos(2 * theta + 1.55) +
    7.8 * Math.sin(3 * theta + 0.75) +
    5.6 * Math.cos(4 * theta + 3.08) +
    4.1 * Math.sin(5 * theta - 0.85) +
    2.6 * Math.cos(7 * theta + 0.4);
  return ISLAND_HALF_EXTENT + warp - superDist;
}

export function getOuterIslandMarginLocal(island, x, z) {
  // Circular coast — identical to getOuterIslandMargin() in meadow_engine.
  return island.radius - Math.hypot(x - island.x, z - island.z);
}

/** Which accessible island dominates [x, z]? `island: null` means the main island. */
export function getAccessibleIslandMarginInfo(x, z) {
  const main = getMainIslandMarginLocal(x, z);
  let bestMargin = main;
  let bestIsland = null;
  for (const island of ISLANDS) {
    if (!isIslandOwned(island.id)) continue; // locked islands are not ground
    const m = getOuterIslandMarginLocal(island, x, z);
    if (m > bestMargin) {
      bestMargin = m;
      bestIsland = island;
    }
  }
  return { margin: bestMargin, island: bestIsland };
}

/** True when [x, z] sits on an outer island that the player has NOT paid for. */
export function isOnLockedIsland(x, z) {
  for (const island of ISLANDS) {
    if (isIslandOwned(island.id)) continue;
    if (getOuterIslandMarginLocal(island, x, z) > -1.5) return island; // crest + beach rim
  }
  return null;
}

function clampTowardCenter(x, z, minInlandMargin, island) {
  const cx = island ? island.x : 0;
  const cz = island ? island.z : 0;
  const dx = x - cx;
  const dz = z - cz;
  const r = Math.hypot(dx, dz);
  if (r < 0.001) return [cx, cz];
  const marginAt = (mid) =>
    island
      ? getOuterIslandMarginLocal(island, cx + dx * mid, cz + dz * mid)
      : getMainIslandMarginLocal(cx + dx * mid, cz + dz * mid);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) * 0.5;
    if (marginAt(mid) >= minInlandMargin) lo = mid;
    else hi = mid;
  }
  return [cx + dx * lo, cz + dz * lo];
}

/**
 * Clamp [x, z] into the accessible union (main island + islands you own).
 * Unowned outer islands are treated as ocean.
 */
export function clampPointToAccessibleIslands(x, z, minInlandMargin = 3.0) {
  const info = getAccessibleIslandMarginInfo(x, z);
  if (info.margin >= minInlandMargin) return [x, z];
  return clampTowardCenter(x, z, minInlandMargin, info.island);
}

/** Lookup helper for gates: the catalog island covering [x, z], or null (main/sea). */
export function getOuterIslandCovering(x, z, padding = 6.5) {
  for (const island of ISLANDS) {
    if (Math.hypot(x - island.x, z - island.z) <= island.radius + padding) return getIslandById(island.id);
  }
  return null;
}
