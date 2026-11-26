// IREOLUWA Archipelago — renders the 20 purchasable islands of the Outer Shoals.
//
// Catalog data (ids, names, prices) lives in shared/islandCatalog.mjs so the
// browser, the dev server and the Stripe serverless functions all agree on it.
// This module builds the procedural terraced voxel mound each island renders
// as, plus the deed signpost with a live canvas plaque that re-renders its
// text when the island is bought or renamed.

import * as THREE from "three";
import { Vox, buildVoxelMesh } from "./vox.js";
import { ISLANDS, formatPrice } from "../../shared/islandCatalog.mjs";

export { ISLANDS };
export const ISLAND_COUNT = ISLANDS.length;

// Biomes: which voxel colors make the island cap and how it decorates itself.
const BIOME = {
  meadow_clover: { top: ["grass", "grass3", "lime", "grass2"], side: "soilDark", accent: "leaf", kind: "forest" },
  sandy_shore: { top: ["sand", "path", "path2", "sand"], side: "soil", accent: "leaf", kind: "palm" },
  misty_moss: { top: ["moss", "grass2", "leafDark", "moss"], side: "soilDark", accent: "leafDark", kind: "forest" },
  volcanic_basalt: { top: ["basalt", "basalt", "ash", "basalt"], side: "ash", accent: "lava", kind: "volcano" },
  snow_frost: { top: ["snow", "white", "snow", "silver"], side: "stone", accent: "leafDark", kind: "pine" },
  stone_plaza: { top: ["concrete", "concrete2", "path2", "concrete"], side: "stone", accent: "slate", kind: "plaza" },
  autumn_grove: { top: ["grass2", "orange", "amber", "grass"], side: "soilDark", accent: "orange", kind: "forest" },
  desert_mesa: { top: ["sand", "path", "terracotta", "sand"], side: "soil", accent: "lime", kind: "desert" },
};

export function getIslandById(id) {
  return ISLANDS.find((isl) => isl.id === id) || null;
}

/** Find the outer island (if any) whose coastal shelf contains [x, z]. */
export function getOuterIslandAt(x, z, padding = 2.5) {
  for (const island of ISLANDS) {
    if (Math.hypot(x - island.x, z - island.z) <= island.radius + padding) return island;
  }
  return null;
}

function voxelScaleFor(radius) {
  if (radius <= 17) return 1.12;
  if (radius <= 25) return 1.32;
  if (radius <= 35) return 1.62;
  if (radius <= 70) return 1.95;
  if (radius <= 105) return 2.25;
  return 2.45;
}

function hash2(i, k, seed) {
  let h = (i * 374761393 + k * 668265263 + seed * 982451653) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

/**
 * Builds a terraced voxel island: flat y=0 plateau (flush with the main
 * island plateau so creations sit directly on it), terraced beach falling
 * below the -0.56 waterline, biome-tinted top layer and a few decorations.
 * Returns a group positioned at the island location; plaque can redraw when
 * ownership changes.
 */
export function buildIslandGroup(island, { owned = false, displayName = null } = {}) {
  const scale = voxelScaleFor(island.radius);
  const cells = Math.ceil((island.radius + 9) / scale);
  const seed = island.index + 7;
  const biome = BIOME[island.biome] || BIOME.meadow_clover;
  const v = new Vox(seed * 7919 + 13);
  const beachOuter = island.radius + 6.5;
  const plateauEnd = island.radius * 0.62;

  for (let i = -cells; i <= cells; i++) {
    for (let k = -cells; k <= cells; k++) {
      const wx = i * scale + scale * 0.5;
      const wz = k * scale + scale * 0.5;
      const d = Math.hypot(wx, wz);
      if (d > beachOuter) continue;
      // Terraced beach profile (0 on plateau → -4 at the waterline fall-off)
      let top;
      if (d <= plateauEnd) {
        top = 0;
      } else {
        const t = (d - plateauEnd) / Math.max(0.001, beachOuter - plateauEnd);
        top = -Math.round(Math.pow(t, 1.35) * 4.4);
      }
      const isRim = d > island.radius * 0.86;
      const n = hash2(i, k, seed);
      // Under-structure — SKIP for deep-interior plateau columns: all of their
      // faces are interior (neighbors of equal height cull them), so those
      // voxels cost build time but render nothing. Big islands get ~60% cheaper.
      const deepInterior = d <= plateauEnd - 2.5 * scale;
      if (!deepInterior) {
        for (let y = -5; y < top; y++) {
          if (top - y > 3) {
            v.put(i, y, k, "basalt");
          } else {
            v.put(i, y, k, biome.side);
          }
        }
      }
      // Surface voxel
      let surfaceColor;
      if (isRim || top < 0) {
        surfaceColor = n > 0.5 ? "sand" : "path2";
      } else {
        surfaceColor = biome.top[Math.floor(n * biome.top.length) % biome.top.length];
      }
      v.put(i, top - 1, k, surfaceColor);
      // Occasional shore rocks
      if (isRim && n > 0.93 && top >= -1) {
        v.put(i, top, k, "stone");
      }
    }
  }

  // ── Decorations (top y=0): keep the centre clear for building ───────────────
  const decorSpots = [];
  const decorCount = Math.min(26, Math.floor(island.radius / 8) + 1);
  for (let dSeat = 0; dSeat < decorCount; dSeat++) {
    const ang = hash2(dSeat, 99, seed) * Math.PI * 2;
    const dist = (0.3 + hash2(dSeat, 55, seed) * 0.42) * island.radius;
    const dx = Math.round((Math.sin(ang) * dist) / scale);
    const dz = Math.round((Math.cos(ang) * dist) / scale);
    if (Math.hypot(dx * scale, dz * scale) < island.radius * 0.3) continue; // keep centre clear
    decorSpots.push([dx, dz]);
  }
  for (const [dx, dz] of decorSpots) {
    const kind = biome.kind;
    if (kind === "forest") {
      const h = 2 + Math.floor(hash2(dx, dz, seed) * 2);
      v.box(dx, 0, dz, dx, h, dz, "woodDark");
      v.put(dx, h + 1, dz, biome.accent);
      v.put(dx + 1, h, dz, biome.accent);
      v.put(dx - 1, h, dz, biome.accent);
      v.put(dx, h, dz + 1, biome.accent);
      v.put(dx, h, dz - 1, biome.accent);
      v.put(dx, h + 2, dz, "leafLight");
    } else if (kind === "palm") {
      v.box(dx, 0, dz, dx, 2, dz, "woodDark");
      v.put(dx + 1, 2, dz, "leaf");
      v.put(dx - 1, 2, dz, "leaf");
      v.put(dx, 2, dz + 1, "leaf");
      v.put(dx, 2, dz - 1, "leaf");
      v.put(dx, 3, dz, "leafLight");
    } else if (kind === "volcano") {
      v.put(dx, 0, dz, "basalt");
      v.put(dx, 1, dz, "basalt");
      v.put(dx + 1, 0, dz, "ash");
      v.put(dx - 1, 0, dz, "ash");
      if (hash2(dx, dz, seed) > 0.55) {
        v.put(dx, 2, dz, "lava", 1.6);
      }
    } else if (kind === "pine") {
      v.box(dx, 0, dz, dx, 1, dz, "woodDark");
      v.put(dx, 2, dz, "leafDark");
      v.put(dx + 1, 2, dz, "leafDark");
      v.put(dx - 1, 2, dz, "leafDark");
      v.put(dx, 2, dz + 1, "leafDark");
      v.put(dx, 2, dz - 1, "leafDark");
      v.put(dx, 3, dz, "snow");
    } else if (kind === "desert") {
      if (hash2(dx, dz, seed) > 0.45) {
        v.box(dx, 0, dz, dx, 2, dz, "lime");
        v.put(dx + 1, 1, dz, "lime");
        v.put(dx - 1, 2, dz, "lime");
      } else {
        v.box(dx, 0, dz, dx, 3, dz, "terracotta");
        v.put(dx, 4, dz, "path");
      }
    } else if (kind === "plaza") {
      v.box(dx, 0, dz, dx, 3, dz, "concrete");
      v.put(dx, 4, dz, "limestone");
      v.put(dx, 5, dz, "brass", 0.8);
    }
  }

  const mesh = buildVoxelMesh(v, { scale, castShadow: false, receiveShadow: false, jitter: 0.02 });
  mesh.position.set(island.x, 0, island.z);
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();

  const group = new THREE.Group();
  group.add(mesh);

  // ── Deed signpost (faces the main island) ───────────────────────────────────
  const signDirX = -island.x;
  const signDirZ = -island.z;
  const signLen = Math.hypot(signDirX, signDirZ) || 1;
  const ux = signDirX / signLen;
  const uz = signDirZ / signLen;
  const standDist = Math.min(island.radius * 0.55, Math.max(2.4, island.radius - 1.5));
  const signX = island.x + ux * standDist;
  const signZ = island.z + uz * standDist;
  const signYaw = Math.atan2(ux, uz);

  const signVox = new Vox(seed * 131 + 3);
  signVox.box(-1, 0, -1, 0, 3, 0, "woodDark");
  signVox.box(-3, 2, -1, 2, 3, 0, "oak");
  signVox.box(-3, 3, -1, 2, 3, 0, "woodLight");
  const signMesh = buildVoxelMesh(signVox, { scale: 0.62, castShadow: false, receiveShadow: false });
  signMesh.position.set(signX, 0, signZ);
  signMesh.rotation.y = signYaw;
  group.add(signMesh);

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const plaqueGeo = new THREE.PlaneGeometry(3.15, 1.6);
  const plaqueMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.62,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    emissive: 0xffffff,
    emissiveMap: texture,
    emissiveIntensity: 0.14,
  });
  const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
  plaque.position.set(signX + Math.sin(signYaw) * 0.36, 1.62, signZ + Math.cos(signYaw) * 0.36);
  plaque.rotation.y = signYaw;
  group.add(plaque);

  const state = { owned, displayName };
  const draw = () => drawPlaque(canvas, island, state.owned, state.displayName);
  draw();
  texture.needsUpdate = true;

  function redraw(nextOwned, nextName) {
    state.owned = Boolean(nextOwned);
    state.displayName = nextName || null;
    draw();
    texture.needsUpdate = true;
  }

  return {
    island,
    group,
    plaque,
    redraw,
    position: { x: island.x, z: island.z },
  };
}

function drawPlaque(canvas, island, owned, displayName) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  // Plank backdrop
  ctx.fillStyle = "#5a3d23";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#6e4c2d";
  ctx.fillRect(10, 10, W - 20, H - 20);
  ctx.strokeStyle = owned ? "#f4c44e" : "#c9935b";
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (owned) {
    ctx.fillStyle = "#f4c44e";
    ctx.font = "bold 38px Georgia, serif";
    ctx.fillText("✦  O W N E D  ✦", W / 2, 52);
    ctx.fillStyle = "#fdf6e3";
    ctx.font = "bold 52px Georgia, serif";
    wrapText(ctx, displayName || island.name || "My Island", W / 2, 130, W - 70, 56);
    ctx.fillStyle = "#d8c6a1";
    ctx.font = "bold 26px Georgia, serif";
    ctx.fillText("IREOLUWA Archipelago", W / 2, 212);
  } else {
    ctx.fillStyle = "#ffe9a8";
    ctx.font = "bold 40px Georgia, serif";
    ctx.fillText("FOR SALE", W / 2, 48);
    ctx.fillStyle = "#fdf6e3";
    ctx.font = "bold 50px Georgia, serif";
    wrapText(ctx, island.name || "Unnamed Isle", W / 2, 116, W - 70, 54);
    ctx.fillStyle = "#ffd98a";
    ctx.font = "bold 42px Georgia, serif";
    ctx.fillText(formatPrice(island.priceCents), W / 2, 196);
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, 2);
  const startY = y - ((shown.length - 1) * lineHeight) / 2;
  shown.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}
