// GeminIsland — Playable 3D In-World Arcade Games for Kids Mode:
// 1. Island Grand Prix ("car_drive") — Dedicated race island & closed-loop speedway track, 3 AI opponent cars,
//    turbo boost pads, 3-2-1-GO countdown, 3-lap standings, and star rewards.
// 2. Island Surfer ("subway_runner") — Subway Surfer-style 3-lane tropical island runner with scrolling palm beaches,
//    surf huts, visible hero avatar facing forward, hover-surfboard power-up, trains, hurdles & surf arches.
// 3. Sky Balloon Pop ("balloon_pop") — 3D raycast balloon-popping color & counting game over Central Plaza.

import * as THREE from "three";
import { Vox, buildVoxelMesh } from "./vox.js";

// ─── Shared Arcade Sound Synth (master mute/volume + spatial falloff) ────────
import {
  ensureGameAudio,
  playGameSweep,
  playGameTone,
} from "./game_audio.js";
import {
  claimMilestone,
  getBest,
  recordBest,
} from "../game_progress.js";
import {
  bufferInput,
  consumeInput,
  decayInput,
  raceRank,
  unwrapAngle,
} from "./game_rules.js";

function ensureArcadeAudio() {
  return ensureGameAudio();
}

function playArcadeTone(freq = 440, dur = 0.14, type = "triangle", gainPeak = 0.08, delay = 0) {
  playGameTone(freq, dur, type, gainPeak, delay);
}

function playCoinSound(combo = 0) {
  const f = 660 + Math.min(8, combo) * 45;
  playArcadeTone(f, 0.11, "triangle", 0.075, 0);
  playArcadeTone(f * 1.498, 0.16, "triangle", 0.075, 0.055);
}

function playStarFanfare() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    playArcadeTone(f, 0.18, "triangle", 0.085, i * 0.065);
  });
}

function playRaceVictoryFanfare() {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
    playArcadeTone(f, 0.22, "triangle", 0.09, i * 0.075);
  });
}

function playBoostSound() {
  playArcadeTone(440, 0.12, "sawtooth", 0.05, 0);
  playArcadeTone(660, 0.14, "triangle", 0.07, 0.05);
  playArcadeTone(880, 0.18, "triangle", 0.07, 0.1);
}

function playCountdownBeep(isGo = false) {
  if (isGo) {
    playArcadeTone(880, 0.26, "triangle", 0.09, 0);
    playArcadeTone(1174.66, 0.3, "triangle", 0.08, 0.05);
  } else {
    playArcadeTone(440, 0.14, "sine", 0.075, 0);
  }
}

function playJumpSound() {
  playGameSweep(280, 620, 0.17, "sine", 0.075);
}

function playSlideSound() {
  playArcadeTone(230, 0.11, "triangle", 0.055, 0);
  playArcadeTone(170, 0.13, "sine", 0.05, 0.04);
}

function playCarHorn() {
  playArcadeTone(440, 0.13, "sawtooth", 0.05, 0);
  playArcadeTone(554.37, 0.13, "sawtooth", 0.05, 0);
  playArcadeTone(440, 0.18, "sawtooth", 0.055, 0.16);
  playArcadeTone(554.37, 0.18, "sawtooth", 0.055, 0.16);
}

function playBumpSound() {
  playArcadeTone(160, 0.16, "sawtooth", 0.065, 0);
  playArcadeTone(115, 0.2, "triangle", 0.06, 0.07);
}

function playBalloonPopSound(pitchIdx = 0) {
  const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
  playArcadeTone(notes[pitchIdx % notes.length], 0.14, "sine", 0.085, 0);
  playArcadeTone(notes[pitchIdx % notes.length] * 1.5, 0.1, "triangle", 0.05, 0.03);
}

// ─── Track Math Helpers (Closed Grand Prix Speedway) ─────────────────────────
const RACE_ORIGIN_X = -340;
const RACE_ORIGIN_Y = 2.0;
const RACE_ORIGIN_Z = 0;
const TRACK_HALF_W = 5.8; // 11.6m wide track
const CURB_W = 1.05;
const TRACK_MAX_LATERAL = 8.4; // soft tire-curb wall beyond this

function getTrackRadiusMod(theta) {
  return 1 + 0.14 * Math.cos(2 * theta) - 0.07 * Math.sin(3 * theta);
}

function getTrackCenter(theta) {
  const rMod = getTrackRadiusMod(theta);
  const x = RACE_ORIGIN_X + 46 * rMod * Math.cos(theta);
  const z = RACE_ORIGIN_Z + 33 * rMod * Math.sin(theta);
  return [x, z];
}

function getTrackFrame(theta) {
  const eps = 0.0025;
  const [x, z] = getTrackCenter(theta);
  const [x1, z1] = getTrackCenter(theta + eps);
  const [x0, z0] = getTrackCenter(theta - eps);
  let tx = x1 - x0;
  let tz = z1 - z0;
  const len = Math.hypot(tx, tz) || 1;
  tx /= len;
  tz /= len;
  // Outward right-hand normal in XZ plane
  const nx = tz;
  const nz = -tx;
  const yaw = Math.atan2(tx, tz);
  return { x, z, tx, tz, nx, nz, yaw };
}

function wrapAngle02Pi(a) {
  const tau = Math.PI * 2;
  let r = a % tau;
  if (r < 0) r += tau;
  return r;
}

function wrapAngleDiff(to, from) {
  return unwrapAngle(from, to);
}

function buildRibbonMesh(segments, innerOffset, outerOffset, yLevel, colorFn, receiveShadow = true) {
  const positions = [];
  const colors = [];
  const indices = [];
  const col = new THREE.Color();

  for (let i = 0; i <= segments; i++) {
    const th = (i / segments) * Math.PI * 2;
    const f = getTrackFrame(th);
    const ix = f.x + f.nx * innerOffset;
    const iz = f.z + f.nz * innerOffset;
    const ox = f.x + f.nx * outerOffset;
    const oz = f.z + f.nz * outerOffset;
    positions.push(ix, yLevel, iz, ox, yLevel, oz);

    const cHex = colorFn(i);
    col.set(cHex);
    colors.push(col.r, col.g, col.b, col.r, col.g, col.b);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = receiveShadow;
  mesh.castShadow = false;
  return mesh;
}

// ─── Voxel Mesh Builders ─────────────────────────────────────────────────────
function buildVoxelSportsCar(bodyColor = "#df5246", stripeColor = "#f5b82e", withAiDriver = false, helmetColor = "#ffffff") {
  const root = new THREE.Group();
  const s = 0.175;

  const body = new Vox(withAiDriver ? 702 : 701);
  // Chassis floor
  body.box(-4, 1, -8, 4, 2, 8, bodyColor);
  // Front hood & bumper
  body.box(-4, 2, 2, 4, 4, 8, bodyColor);
  body.box(-4, 1, 8, 4, 2, 9, "#f5f7fa");
  // Headlights
  body.put(-3, 3, 8, "#fff4b8", 1.5);
  body.put(3, 3, 8, "#fff4b8", 1.5);
  // Racing stripes
  body.box(-1, 4, 2, 1, 4, 8, stripeColor);
  // Side doors
  body.box(-4, 2, -4, -3, 4, 2, bodyColor);
  body.box(3, 2, -4, 4, 4, 2, bodyColor);
  // Rear deck & spoiler
  body.box(-4, 2, -8, 4, 4, -4, bodyColor);
  body.box(-4, 5, -8, 4, 5, -7, stripeColor);
  body.put(-3, 4, -8, stripeColor);
  body.put(3, 4, -8, stripeColor);
  // Taillights
  body.put(-3, 3, -8, "#ff6b6b", 1.2);
  body.put(3, 3, -8, "#ff6b6b", 1.2);
  // Windshield frame + tinted glass
  body.box(-3, 4, 2, 3, 6, 2, "#9ed8f5");
  body.box(-4, 4, 2, -4, 6, 2, "#e8edf2");
  body.box(4, 4, 2, 4, 6, 2, "#e8edf2");
  body.box(-4, 6, 2, 4, 6, 2, "#e8edf2");
  // Seat & steering wheel
  body.box(-2, 2, -3, 2, 3, 0, "#3b4252");
  body.box(-1, 3, -4, 1, 5, -3, "#3b4252");
  body.box(-1, 4, 1, 1, 5, 1, "#222730");

  if (withAiDriver) {
    // Cute voxel racer seated inside opponent car facing +Z
    body.box(-2, 3, -2, 2, 6, 0, bodyColor);
    body.box(-2, 6, -2, 2, 10, 1, helmetColor);
    body.box(-2, 7, 1, 2, 9, 2, "#1e293b"); // visor
    body.box(-1, 8, 2, 1, 8, 2, "#38bdf8");
  }

  const bodyMesh = buildVoxelMesh(body, { scale: s });
  root.add(bodyMesh);

  const makeWheel = (seed) => {
    const wv = new Vox(seed);
    wv.box(-1, -1, -1, 1, 1, 1, "#262930");
    wv.put(0, 0, 0, "#d8dee9");
    wv.put(-1, 0, 0, "#d8dee9");
    wv.put(1, 0, 0, "#d8dee9");
    const pivot = new THREE.Group();
    pivot.add(buildVoxelMesh(wv, { scale: s * 1.15, depthLayer: 1 }));
    return pivot;
  };

  const wheels = {
    fl: makeWheel(711),
    fr: makeWheel(712),
    rl: makeWheel(713),
    rr: makeWheel(714),
  };
  wheels.fl.position.set(4.1 * s, 1.35 * s, 5.0 * s);
  wheels.fr.position.set(-4.1 * s, 1.35 * s, 5.0 * s);
  wheels.rl.position.set(4.1 * s, 1.35 * s, -5.0 * s);
  wheels.rr.position.set(-4.1 * s, 1.35 * s, -5.0 * s);
  root.add(wheels.fl, wheels.fr, wheels.rl, wheels.rr);

  return { root, wheels, seatY: 2.8 * s, seatZ: -1.4 * s };
}

function buildStartFinishArch() {
  const v = new Vox(718);
  // Left & Right tall pillars spanning 12m wide track (scale 0.25 -> ±28 vox)
  v.box(-29, 0, -2, -26, 18, 2, "#ef4444");
  v.box(26, 0, -2, 29, 18, 2, "#ef4444");
  // White bands on pillars
  v.box(-29, 5, -2, -26, 7, 2, "#ffffff");
  v.box(-29, 12, -2, -26, 14, 2, "#ffffff");
  v.box(26, 5, -2, 29, 7, 2, "#ffffff");
  v.box(26, 12, -2, 29, 14, 2, "#ffffff");
  // Checkered gantry bridge overhead
  for (let x = -28; x <= 27; x += 4) {
    const even = Math.floor((x + 28) / 4) % 2 === 0;
    v.box(x, 15, -2, x + 3, 19, 2, even ? "#181a20" : "#ffffff");
    v.box(x, 19, -2, x + 3, 21, 2, even ? "#ffffff" : "#181a20");
  }
  // Center red/amber/green race light box
  v.box(-6, 13, -3, 6, 16, 3, "#262930");
  v.box(-4, 14, 3, -3, 15, 3, "#ef4444", 1.2);
  v.box(-1, 14, 3, 0, 15, 3, "#f59e0b", 1.2);
  v.box(2, 14, 3, 3, 15, 3, "#22c55e", 1.5);
  return buildVoxelMesh(v, { scale: 0.24 });
}

function buildGrandstandMesh() {
  const v = new Vox(720);
  // Concrete base & tiered seating
  v.box(-14, 0, -6, 14, 2, 6, "#64748b");
  v.box(-14, 2, -2, 14, 4, 6, "#94a3b8");
  v.box(-14, 4, 1, 14, 6, 6, "#cbd5e1");
  // Roof canopy
  v.box(-15, 11, -3, 15, 12, 7, "#2563eb");
  v.box(-14, 6, 5, -13, 11, 6, "#f8fafc");
  v.box(13, 6, 5, 14, 11, 6, "#f8fafc");
  // Colorful voxel cheering spectators
  const fanColors = ["#ef4444", "#f59e0b", "#10b981", "#ec4899", "#38bdf8", "#a855f7"];
  for (let i = -12; i <= 12; i += 4) {
    const col = fanColors[Math.abs(i) % fanColors.length];
    v.box(i, 3, -1, i + 1, 5, 0, col);
    v.box(i, 5, -1, i + 1, 6, 0, "#f4cba6");
    const col2 = fanColors[Math.abs(i + 3) % fanColors.length];
    v.box(i - 1, 5, 2, i, 7, 3, col2);
    v.box(i - 1, 7, 2, i, 8, 3, "#eab586");
  }
  return buildVoxelMesh(v, { scale: 0.34 });
}

function buildPalmTreeMesh(seed = 722) {
  const v = new Vox(seed);
  // Curved trunk
  v.box(-1, 0, -1, 1, 4, 1, "#8f5e36");
  v.box(-1, 4, 0, 1, 9, 2, "#a87444");
  v.box(0, 9, 1, 2, 14, 3, "#8f5e36");
  // Fronds
  v.box(-5, 13, 1, 6, 14, 3, "#4aa853");
  v.box(0, 13, -4, 2, 14, 7, "#58ad52");
  v.box(-3, 14, -2, 4, 15, 5, "#78c86c");
  v.put(-5, 12, 2, "#4aa853");
  v.put(6, 12, 2, "#4aa853");
  v.put(1, 12, -4, "#4aa853");
  v.put(1, 12, 7, "#4aa853");
  return buildVoxelMesh(v, { scale: 0.28 });
}

function buildBoostPadMesh() {
  const v = new Vox(724);
  v.box(-5, 0, -5, 5, 0, 5, "#0ea5e9", 0.5);
  // Glowing yellow chevron arrows
  v.box(-3, 0, -2, -2, 0, 0, "#fde047", 1.8);
  v.box(2, 0, -2, 3, 0, 0, "#fde047", 1.8);
  v.box(-2, 0, 0, -1, 0, 2, "#fde047", 1.8);
  v.box(1, 0, 0, 2, 0, 2, "#fde047", 1.8);
  v.box(-1, 0, 2, 1, 0, 4, "#ffffff", 2.0);
  return buildVoxelMesh(v, { scale: 0.24, castShadow: false });
}

function buildRaceIslandGroup() {
  const group = new THREE.Group();

  // 1. Sculpted Grass Island & Sandy Beach Skirt using Shape + ExtrudeGeometry
  const makeIslandShape = (scaleMul) => {
    const sh = new THREE.Shape();
    const pts = 72;
    for (let i = 0; i < pts; i++) {
      const th = (i / pts) * Math.PI * 2;
      const rMod = getTrackRadiusMod(th);
      const rx = 62 * rMod * scaleMul;
      const rz = 46 * rMod * scaleMul;
      const px = rx * Math.cos(th);
      const py = -rz * Math.sin(th); // Extrude rotated -PI/2 maps shape Y -> -worldZ
      if (i === 0) sh.moveTo(px, py);
      else sh.lineTo(px, py);
    }
    sh.closePath();
    return sh;
  };

  const grassGeo = new THREE.ExtrudeGeometry(makeIslandShape(1.0), {
    depth: 1.65,
    bevelEnabled: false,
  });
  grassGeo.rotateX(-Math.PI / 2);
  const grassMesh = new THREE.Mesh(
    grassGeo,
    new THREE.MeshStandardMaterial({ color: "#6dbf54", roughness: 0.9, metalness: 0.0 }),
  );
  grassMesh.position.set(RACE_ORIGIN_X, RACE_ORIGIN_Y - 1.65, RACE_ORIGIN_Z);
  grassMesh.receiveShadow = true;
  group.add(grassMesh);

  const sandGeo = new THREE.ExtrudeGeometry(makeIslandShape(1.07), {
    depth: 1.4,
    bevelEnabled: false,
  });
  sandGeo.rotateX(-Math.PI / 2);
  const sandMesh = new THREE.Mesh(
    sandGeo,
    new THREE.MeshStandardMaterial({ color: "#ebd399", roughness: 0.94, metalness: 0.0 }),
  );
  sandMesh.position.set(RACE_ORIGIN_X, RACE_ORIGIN_Y - 1.9, RACE_ORIGIN_Z);
  sandMesh.receiveShadow = true;
  group.add(sandMesh);

  // 2. Asphalt Speedway Track + Alternating Red/White Racing Curbs + Dashed Center Line
  const SEGS = 128;
  group.add(
    buildRibbonMesh(SEGS, -TRACK_HALF_W, TRACK_HALF_W, RACE_ORIGIN_Y + 0.05, () => "#3b4252", true),
  );
  group.add(
    buildRibbonMesh(
      SEGS,
      TRACK_HALF_W,
      TRACK_HALF_W + CURB_W,
      RACE_ORIGIN_Y + 0.06,
      (i) => (i % 2 === 0 ? "#ef4444" : "#ffffff"),
      true,
    ),
  );
  group.add(
    buildRibbonMesh(
      SEGS,
      -TRACK_HALF_W - CURB_W,
      -TRACK_HALF_W,
      RACE_ORIGIN_Y + 0.06,
      (i) => (i % 2 === 0 ? "#ffffff" : "#ef4444"),
      true,
    ),
  );
  group.add(
    buildRibbonMesh(
      SEGS,
      -0.22,
      0.22,
      RACE_ORIGIN_Y + 0.075,
      (i) => (i % 2 === 0 ? "#f8fafc" : "#3b4252"),
      false,
    ),
  );

  // 3. Checkered Start/Finish Line + Tall Checkered Archway + Grandstand
  const startF = getTrackFrame(0);
  const startStripe = buildRibbonMesh(
    4,
    -TRACK_HALF_W,
    TRACK_HALF_W,
    RACE_ORIGIN_Y + 0.085,
    (i) => (i % 2 === 0 ? "#ffffff" : "#181a20"),
    false,
  );
  // Keep only the first small slice at theta=0 by placing a dedicated checkered bar mesh
  startStripe.geometry.dispose();
  startStripe.material.dispose();

  const checkerVox = new Vox(721);
  for (let x = -22; x <= 21; x += 2) {
    for (let z = -2; z <= 1; z += 2) {
      const even = (Math.floor((x + 22) / 2) + Math.floor((z + 2) / 2)) % 2 === 0;
      checkerVox.box(x, 0, z, x + 1, 0, z + 1, even ? "#ffffff" : "#181a20");
    }
  }
  const checkerBar = buildVoxelMesh(checkerVox, { scale: 0.25, castShadow: false });
  checkerBar.position.set(startF.x, RACE_ORIGIN_Y + 0.075, startF.z);
  checkerBar.rotation.y = startF.yaw;
  group.add(checkerBar);

  const arch = buildStartFinishArch();
  arch.position.set(startF.x, RACE_ORIGIN_Y, startF.z);
  arch.rotation.y = startF.yaw;
  group.add(arch);

  const stand = buildGrandstandMesh();
  stand.position.set(startF.x + startF.nx * 12.2, RACE_ORIGIN_Y, startF.z + startF.nz * 12.2);
  stand.rotation.y = startF.yaw - Math.PI * 0.5;
  group.add(stand);

  // 4. Boost Pads around the circuit
  const boostThetas = [Math.PI * 0.32, Math.PI * 0.85, Math.PI * 1.32, Math.PI * 1.78];
  const boostProto = buildBoostPadMesh();
  const boostPads = [];
  for (const bth of boostThetas) {
    const bf = getTrackFrame(bth);
    const pad = boostProto.clone();
    pad.position.set(bf.x, RACE_ORIGIN_Y + 0.075, bf.z);
    pad.rotation.y = bf.yaw;
    group.add(pad);
    boostPads.push({ x: bf.x, z: bf.z });
  }

  // 5. Trackside Voxel Palm Trees (outer & inner island scenery)
  const treeProto = buildPalmTreeMesh(722);
  for (let i = 0; i < 18; i++) {
    const th = (i / 18) * Math.PI * 2 + 0.14;
    if (Math.abs(th) < 0.25 || Math.abs(th - Math.PI * 2) < 0.25) continue;
    const f = getTrackFrame(th);
    const side = i % 2 === 0 ? 11.2 : -11.4;
    const tree = treeProto.clone();
    tree.position.set(f.x + f.nx * side, RACE_ORIGIN_Y, f.z + f.nz * side);
    tree.rotation.y = i * 1.1;
    group.add(tree);
  }

  return { group, boostPads };
}

function buildStarMesh(color = "#ffd54f") {
  const v = new Vox(725);
  v.box(-1, -1, 0, 1, 1, 0, color, 1.4);
  v.put(0, 2, 0, color, 1.6);
  v.put(0, -2, 0, color, 1.6);
  v.put(2, 0, 0, color, 1.6);
  v.put(-2, 0, 0, color, 1.6);
  v.put(0, 0, 1, "#fff6c4", 1.5);
  v.put(0, 0, -1, "#fff6c4", 1.5);
  return buildVoxelMesh(v, { scale: 0.22, castShadow: false, depthLayer: 2 });
}

function buildCoinMesh() {
  const v = new Vox(728);
  v.box(-1, -1, 0, 1, 1, 0, "#ffd54f", 1.3);
  v.put(0, 2, 0, "#ffe57f", 1.4);
  v.put(0, -2, 0, "#ffe57f", 1.4);
  v.put(2, 0, 0, "#ffe57f", 1.4);
  v.put(-2, 0, 0, "#ffe57f", 1.4);
  v.put(0, 0, 0, "#fff8d6", 1.5);
  return buildVoxelMesh(v, { scale: 0.16, castShadow: false, depthLayer: 2 });
}

function buildHoverSurfboardMesh() {
  const v = new Vox(729);
  // Bright rainbow surfboard beneath character's feet
  v.box(-2, 0, -4, 2, 0, 4, "#06b6d4");
  v.box(-1, 0, -5, 1, 0, 5, "#fde047");
  v.box(-1, 0, -2, 1, 0, 2, "#ec4899", 0.9);
  v.put(0, 0, 6, "#ffffff", 1.2);
  v.put(0, 0, -6, "#0ea5e9");
  return buildVoxelMesh(v, { scale: 0.18, castShadow: false });
}

function buildRunnerTrainMesh(color = "#e65245") {
  const v = new Vox(731);
  // Subway-style colorful island train carriage
  v.box(-4, 0, -9, 4, 8, 9, color);
  // White roof + AC pod
  v.box(-3, 8, -9, 3, 9, 9, "#f5f7fa");
  v.box(-2, 9, -5, 2, 10, 5, "#cbd5e1");
  // Blue panoramic windows & sunny yellow stripe
  v.box(-4, 4, -7, 4, 6, 7, "#38bdf8");
  v.box(-4, 3, -9, 4, 3, 9, "#f5b82e");
  // Front windshield & glowing headlights
  v.box(-3, 4, 9, 3, 7, 9, "#9ed8f5");
  v.put(-3, 2, 9, "#fff4b8", 1.6);
  v.put(3, 2, 9, "#fff4b8", 1.6);
  // Front bumper
  v.box(-4, 0, 9, 4, 1, 10, "#334155");
  return buildVoxelMesh(v, { scale: 0.21 });
}

function buildRunnerBarrierMesh() {
  const v = new Vox(735);
  v.box(-4, 0, -1, -3, 3, 1, "#334155");
  v.box(3, 0, -1, 4, 3, 1, "#334155");
  v.box(-4, 2, -1, 4, 4, 1, "#f97316");
  v.box(-2, 2, -1, -1, 4, 1, "#ffffff");
  v.box(1, 2, -1, 2, 4, 1, "#ffffff");
  return buildVoxelMesh(v, { scale: 0.21 });
}

function buildRunnerArchMesh() {
  const v = new Vox(739);
  v.box(-5, 0, -1, -4, 9, 1, "#0284c7");
  v.box(4, 0, -1, 5, 9, 1, "#0284c7");
  v.box(-5, 6, -1, 5, 9, 1, "#f59e0b");
  v.box(-3, 6, -1, 3, 8, 1, "#fef08a");
  return buildVoxelMesh(v, { scale: 0.21 });
}

function buildIslandRunnerSegmentMesh(variant = 0) {
  const group = new THREE.Group();
  const s = 0.23;

  // 1. Central 3-lane Subway Track + Sandy Beach + Lush Island Shores
  const v = new Vox(743 + variant);
  // Track gravel bed (x: -16..16)
  v.box(-16, -2, -12, 16, 0, 12, "#64748b");
  // Wooden railway ties across 3 lanes + gleaming rails
  for (let z = -11; z <= 11; z += 4) {
    v.box(-14, 0, z, -7, 0, z, "#92623a");
    v.box(-4, 0, z, 4, 0, z, "#92623a");
    v.box(7, 0, z, 14, 0, z, "#92623a");
  }
  for (const rx of [-14, -8, -4, 4, 8, 14]) {
    v.box(rx, 0, -12, rx, 0, 12, "#cbd5e1");
  }
  // Lane divider dashes
  for (let z = -10; z <= 10; z += 5) {
    v.box(-6, 0, z, -5, 0, z + 2, "#f8fafc");
    v.box(5, 0, z, 6, 0, z + 2, "#f8fafc");
  }

  // Lush Grass Curbs & Tropical Island Cliffs/Beaches on both Left and Right!
  v.box(-32, -3, -12, -17, 1, 12, "#58ad52");
  v.box(17, -3, -12, 32, 1, 12, "#58ad52");
  // Golden sandy beaches sloping out toward the turquoise sea
  v.box(-42, -5, -12, -32, 0, 12, "#ebd399");
  v.box(32, -5, -12, 42, 0, 12, "#ebd399");
  // Raised grassy cliff terrace on outer edge
  v.box(-30, 1, -12, -23, 3, 12, "#78c86c");
  v.box(23, 1, -12, 30, 3, 12, "#78c86c");

  if (variant % 2 === 0) {
    // Swaying voxel palm tree on left island + colorful beach umbrella on right
    v.box(-26, 3, -2, -25, 11, -1, "#8f5e36");
    v.box(-29, 11, -5, -22, 12, 2, "#4aa853");
    v.box(-27, 12, -3, -24, 13, 0, "#78c86c");

    // Beach umbrella on right sand
    v.box(36, 0, 0, 36, 6, 0, "#f8fafc");
    v.box(33, 6, -3, 39, 7, 3, variant === 0 ? "#ef4444" : "#f59e0b");
    v.box(34, 7, -2, 38, 8, 2, "#ffffff");
  } else {
    // Colorful Surf Shack on right island + palm tree on left beach
    v.box(24, 3, -5, 30, 9, 4, variant === 1 ? "#38bdf8" : "#ec4899");
    v.box(23, 9, -6, 31, 11, 5, "#f5b82e");
    v.box(23, 4, -2, 24, 8, 1, "#faf3e3"); // surf window

    // Left beach palm
    v.box(-36, 0, 2, -35, 9, 3, "#a87444");
    v.box(-39, 9, -1, -32, 10, 6, "#58ad52");
    v.box(-37, 10, 1, -34, 11, 4, "#78c86c");
  }

  group.add(buildVoxelMesh(v, { scale: s, receiveShadow: true, castShadow: false }));
  return group;
}

function buildBalloonGroup(colorHex, colorName) {
  const g = new THREE.Group();
  const bv = new Vox(751);
  bv.box(-2, 0, -2, 2, 5, 2, colorHex);
  bv.box(-3, 1, -2, 3, 4, 2, colorHex);
  bv.box(-2, 1, -3, 2, 4, 3, colorHex);
  bv.box(-1, 5, -1, 1, 6, 1, colorHex);
  bv.put(2, 4, 1, "#ffffff", 1.2);
  bv.put(0, -1, 0, colorHex);
  bv.box(0, -5, 0, 0, -2, 0, "#f8fafc");
  const mesh = buildVoxelMesh(bv, { scale: 0.22 });
  g.add(mesh);
  g.userData = { balloonColor: colorName, colorHex };
  return g;
}

// ─── Main Arcade Games Controller ────────────────────────────────────────────
export function createKidsArcadeSystem({
  scene,
  fpCamera,
  skyDome,
  sun,
  hemi,
  oceanMesh,
  grassUniforms,
  syncComposerCamera,
  updateTexelSnappedSun,
  getIslandGroundHeight,
  resolveCarPosition: _unusedResolveCarPos,
  localAvatarRig,
  onEarnStar,
  onHudChange,
  onExit,
}) {
  const arcadeGroup = new THREE.Group();
  arcadeGroup.visible = false;
  scene.add(arcadeGroup);

  let activeMode = null; // null | "car_drive" | "subway_runner" | "balloon_pop"
  const inputs = {
    left: false,
    right: false,
    up: false,
    down: false,
  };
  let jumpQueued = 0; // buffered seconds, so inputs just before landing still fire
  let slideQueued = 0;
  let racePublishTimer = 0;
  const remoteRacerMarkers = new Map();

  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const _lookDummy = new THREE.Object3D();

  // ── 1. Island Grand Prix (Dedicated Race Track Island + AI Opponents) ─────
  const TOTAL_LAPS = 3;
  const raceWorld = buildRaceIslandGroup();
  raceWorld.group.visible = false;
  arcadeGroup.add(raceWorld.group);

  const carGroup = new THREE.Group();
  const carModel = buildVoxelSportsCar("#df5246", "#f5b82e", false);
  carGroup.add(carModel.root);
  carGroup.visible = false;
  arcadeGroup.add(carGroup);

  const AI_SPECS = [
    { name: "Blue Bolt", body: "#2563eb", stripe: "#38bdf8", helmet: "#f8fafc", laneOff: -2.9, baseRate: 0.365 },
    { name: "Sunny Flash", body: "#f59e0b", stripe: "#ffffff", helmet: "#ef4444", laneOff: 2.9, baseRate: 0.345 },
    { name: "Mint Turbo", body: "#10b981", stripe: "#fde047", helmet: "#38bdf8", laneOff: 0.2, baseRate: 0.325 },
  ];
  const aiCars = AI_SPECS.map((spec) => {
    const model = buildVoxelSportsCar(spec.body, spec.stripe, true, spec.helmet);
    model.root.visible = false;
    arcadeGroup.add(model.root);
    return {
      spec,
      model,
      theta: 0,
      lap: 1,
      totalProgress: 0,
      laneOffset: spec.laneOff,
      speedRate: spec.baseRate,
      wheelSpin: 0,
      x: 0,
      z: 0,
      yaw: 0,
    };
  });

  const carStarProto = buildStarMesh("#ffd54f");
  const carStarsGroup = new THREE.Group();
  carStarsGroup.visible = false;
  arcadeGroup.add(carStarsGroup);

  const carStars = [];
  for (let i = 0; i < 16; i++) {
    const th = (i / 16) * Math.PI * 2 + 0.19;
    const f = getTrackFrame(th);
    const laneShift = ((i % 3) - 1) * 2.7;
    const sx = f.x + f.nx * laneShift;
    const sz = f.z + f.nz * laneShift;
    const m = carStarProto.clone();
    m.position.set(sx, RACE_ORIGIN_Y + 0.95, sz);
    carStarsGroup.add(m);
    carStars.push({ mesh: m, x: sx, z: sz, collected: false, respawnTimer: 0 });
  }

  const carState = {
    x: 0,
    z: 0,
    yaw: 0,
    speed: 0,
    steer: 0,
    wheelSpin: 0,
    autoDrive: false,
    bounceTimer: 0,
    boostTimer: 0,
    countdownTimer: 2.8,
    lastCountdownBeat: 4,
    lap: 1,
    lastTheta: 0,
    unwrappedTheta: 0,
    totalProgress: 0,
    rank: 4,
    finishRank: 0,
    raceFinished: false,
    score: 0,
    starsEarned: 0,
  };

  function findNearestTrackInfo(x, z, hintTheta) {
    let bestTh = hintTheta;
    let bestD2 = Infinity;
    // Local neighborhood search around hintTheta first (handles curved track accurately)
    for (let k = -18; k <= 18; k++) {
      const th = wrapAngle02Pi(hintTheta + k * 0.045);
      const [cx, cz] = getTrackCenter(th);
      const d2 = (x - cx) ** 2 + (z - cz) ** 2;
      if (d2 < bestD2) {
        bestD2 = d2;
        bestTh = th;
      }
    }
    // Fine search
    for (let k = -6; k <= 6; k++) {
      const th = wrapAngle02Pi(bestTh + k * 0.006);
      const [cx, cz] = getTrackCenter(th);
      const d2 = (x - cx) ** 2 + (z - cz) ** 2;
      if (d2 < bestD2) {
        bestD2 = d2;
        bestTh = th;
      }
    }
    const f = getTrackFrame(bestTh);
    const latOffset = (x - f.x) * f.nx + (z - f.z) * f.nz;
    return { theta: bestTh, frame: f, latOffset };
  }

  // ── 2. Island Surfer (Subway Surfer-Style Tropical Island) ─────────────────
  const RUNNER_ORIGIN_X = 360;
  const RUNNER_ORIGIN_Y = 2.0;
  const LANE_X = [-2.45, 0, 2.45];
  const TRACK_SEG_LEN = 5.52;
  const TRACK_SEG_COUNT = 18;

  const runnerGroup = new THREE.Group();
  runnerGroup.visible = false;
  arcadeGroup.add(runnerGroup);

  const trackSegs = [];
  const segVariants = [0, 1, 2, 3].map((v) => buildIslandRunnerSegmentMesh(v));
  for (let i = 0; i < TRACK_SEG_COUNT; i++) {
    const seg = segVariants[i % segVariants.length].clone();
    seg.position.set(RUNNER_ORIGIN_X, RUNNER_ORIGIN_Y, -i * TRACK_SEG_LEN + 8);
    runnerGroup.add(seg);
    trackSegs.push(seg);
  }

  // Character ground drop-shadow & hover surfboard
  const runnerShadowMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 20),
    new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.32 }),
  );
  runnerShadowMesh.rotation.x = -Math.PI / 2;
  runnerShadowMesh.position.set(RUNNER_ORIGIN_X, RUNNER_ORIGIN_Y + 0.04, 0);
  runnerGroup.add(runnerShadowMesh);

  const playerSurfboard = buildHoverSurfboardMesh();
  playerSurfboard.visible = false;
  runnerGroup.add(playerSurfboard);

  const trainProtoRed = buildRunnerTrainMesh("#df5246");
  const trainProtoBlue = buildRunnerTrainMesh("#2563eb");
  const trainProtoTeal = buildRunnerTrainMesh("#0d9488");
  const barrierProto = buildRunnerBarrierMesh();
  const archProto = buildRunnerArchMesh();
  const coinProto = buildCoinMesh();
  const pickupBoardProto = buildHoverSurfboardMesh();

  const runnerObstacles = [];
  const runnerCoins = [];
  const runnerBoards = [];

  const runnerState = {
    lane: 1,
    x: RUNNER_ORIGIN_X,
    y: RUNNER_ORIGIN_Y,
    vy: 0,
    slideTimer: 0,
    surfTimer: 0,
    speed: 12.2,
    dist: 0,
    coins: 0,
    hearts: 3,
    invulnTimer: 0,
    spawnTimer: 0,
    gameOver: false,
    starsEarned: 0,
    combo: 0,
    bestCombo: 0,
    nearMisses: 0,
    nearMilestone5: false,
    nearMilestone15: false,
    milestone500: false,
    milestone1000: false,
  };

  // ── 3. Sky Balloon Pop State ───────────────────────────────────────────────
  const BALLOON_COLORS = [
    { name: "Red", hex: "#ef4444" },
    { name: "Blue", hex: "#3b82f6" },
    { name: "Yellow", hex: "#f59e0b" },
    { name: "Green", hex: "#10b981" },
  ];
  const balloonGroup = new THREE.Group();
  balloonGroup.visible = false;
  arcadeGroup.add(balloonGroup);

  const balloonItems = [];
  const balloonRaycaster = new THREE.Raycaster();
  const confettiGroup = new THREE.Group();
  balloonGroup.add(confettiGroup);
  const confettiBurst = [];
  const confettiMaterials = new Map();
  const confettiGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);

  const balloonState = {
    targetColor: "Red",
    targetCount: 4,
    hits: 0,
    totalPopped: 0,
    starsEarned: 0,
    combo: 0,
    bestStreak: 0,
    missions: 0,
    roundSec: 45,
    gameOver: false,
  };

  function ordinal(n) {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
  }

  function emitHud() {
    if (!activeMode) {
      onHudChange?.(null);
      return;
    }
    if (activeMode === "car_drive") {
      let countdownText = null;
      if (carState.countdownTimer > 0) {
        const beat = Math.ceil(carState.countdownTimer / 0.55);
        countdownText = beat >= 3 ? "3" : beat === 2 ? "2" : "1";
      } else if (carState.countdownTimer > -0.65 && carState.unwrappedTheta < 0.3) {
        countdownText = "GO!";
      }

      const rank = carState.raceFinished ? carState.finishRank : carState.rank;
      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏁";
      onHudChange?.({
        mode: "car_drive",
        title: "Island Grand Prix",
        scoreValue: carState.score,
        scoreLabel: `${medal} ${ordinal(rank)}/4 · Lap ${Math.min(TOTAL_LAPS, carState.lap)}/${TOTAL_LAPS} · ★ ${carState.score} · Best ${getBest("car_drive", "stars")}`,
        subLabel: carState.raceFinished
          ? `Finished ${ordinal(rank)} place with ${carState.score} stars!`
          : carState.boostTimer > 0
            ? "⚡ TURBO BOOST!"
            : carState.autoDrive
              ? "Auto-Drive ON · Press ▲▼◀▶ to take over!"
              : "Use Arrow Keys (▲ ▼ ◀ ▶) to drive & steer!",
        countdownText,
        raceFinished: carState.raceFinished,
        finishBadge: `${medal} ${ordinal(rank)} Place!`,
        finishText: `Awesome driving! You finished ${ordinal(rank)} out of 4 cars and collected ${carState.score} track stars!`,
        autoDrive: carState.autoDrive,
      });
    } else if (activeMode === "subway_runner") {
      const heartsText = "❤️".repeat(Math.max(0, runnerState.hearts)) + "🤍".repeat(Math.max(0, 3 - runnerState.hearts));
      const surfTag = runnerState.surfTimer > 0 ? " · 🏄 SURF!" : "";
      const comboTag = runnerState.combo > 2 ? ` · 🔥 ×${runnerState.combo} combo` : "";
      onHudChange?.({
        mode: "subway_runner",
        title: "Island Surfer",
        scoreValue: runnerState.coins,
        scoreLabel: `Coins ${runnerState.coins} · ${Math.round(runnerState.dist)}m · ${heartsText} · 💨 ${runnerState.nearMisses} near misses${surfTag}${comboTag} · Best ${getBest("subway_runner", "coins")}`,
        subLabel: runnerState.gameOver
          ? `Great surf run! Collected ${runnerState.coins} coins!`
          : runnerState.surfTimer > 0
            ? "Hover-Surfboard active! 1 free shield!"
            : "Dodge trains, jump hurdles & grab 🏄 surfboards!",
        gameOver: runnerState.gameOver,
        finishBadge: "🏄 Great Run!",
        finishText: `You surfed ${Math.round(runnerState.dist)}m with ${runnerState.coins} coins and ${runnerState.nearMisses} near misses!`,
      });
    } else if (activeMode === "balloon_pop") {
      onHudChange?.({
        mode: "balloon_pop",
        title: "Sky Balloon Pop",
        scoreValue: balloonState.missions,
        scoreLabel: `Pop ${balloonState.targetColor.toUpperCase()}: ${balloonState.hits}/${balloonState.targetCount} · ${Math.max(0, Math.ceil(balloonState.roundSec))}s · Best ${getBest("balloon_pop", "missions")}`,
        subLabel: balloonState.gameOver
          ? `Round complete! ${balloonState.missions} missions cleared.`
          : `Tap ${balloonState.targetColor} balloons · Streak ×${Math.max(1, balloonState.combo)}`,
        targetColor: balloonState.targetColor,
        gameOver: balloonState.gameOver,
        finishBadge: "🎈 Balloon Round Complete!",
        finishText: `You cleared ${balloonState.missions} colour missions with a best streak of ${balloonState.bestStreak}!`,
      });
    }
  }

  // ─── Start / Reset Helpers ─────────────────────────────────────────────────
  function startCarDrive() {
    clearRunnerEntities();
    clearBalloons();
    activeMode = "car_drive";
    arcadeGroup.visible = true;
    raceWorld.group.visible = true;
    carGroup.visible = true;
    carStarsGroup.visible = true;
    runnerGroup.visible = false;
    balloonGroup.visible = false;

    // Place player & 3 AI cars on staggered start grid just behind theta = 0!
    const gridSpots = [
      { th: wrapAngle02Pi(-0.045), lat: -2.5 }, // Player starts P4 on inside rear for fun overtakes!
      { th: wrapAngle02Pi(-0.025), lat: 2.5 },  // AI 0
      { th: wrapAngle02Pi(-0.015), lat: -2.2 }, // AI 1
      { th: wrapAngle02Pi(0.0), lat: 2.2 },     // AI 2
    ];

    const pf = getTrackFrame(gridSpots[0].th);
    inputs.left = false;
    inputs.right = false;
    inputs.up = false;
    inputs.down = false;
    carState.autoDrive = false;
    carState.x = pf.x + pf.nx * gridSpots[0].lat;
    carState.z = pf.z + pf.nz * gridSpots[0].lat;
    carState.yaw = pf.yaw;
    carState.speed = 0;
    carState.steer = 0;
    carState.wheelSpin = 0;
    carState.bounceTimer = 0;
    carState.boostTimer = 0;
    carState.countdownTimer = 1.65;
    carState.lastCountdownBeat = 4;
    carState.lap = 1;
    carState.lastTheta = gridSpots[0].th;
    carState.unwrappedTheta = -0.045;
    carState.totalProgress = -0.045;
    carState.rank = 4;
    carState.finishRank = 0;
    carState.raceFinished = false;
    carState.score = 0;
    carState.starsEarned = 0;

    aiCars.forEach((ai, idx) => {
      const gs = gridSpots[idx + 1];
      const af = getTrackFrame(gs.th);
      ai.theta = gs.th;
      ai.lap = 1;
      // Keep AI progress in the same unwrapped coordinate space as the player.
      // Previously two cars were placed a whole lap behind, so the announced P4
      // start immediately became P2 on the first standings update.
      ai.totalProgress = carState.totalProgress + wrapAngleDiff(gs.th, gridSpots[0].th);
      ai.laneOffset = ai.spec.laneOff;
      ai.speedRate = ai.spec.baseRate;
      ai.wheelSpin = 0;
      ai.x = af.x + af.nx * gs.lat;
      ai.z = af.z + af.nz * gs.lat;
      ai.yaw = af.yaw;
      ai.model.root.visible = true;
      ai.model.root.position.set(ai.x, RACE_ORIGIN_Y + 0.05, ai.z);
      ai.model.root.rotation.set(0, ai.yaw, 0);
    });

    carStars.forEach((st) => {
      st.collected = false;
      st.respawnTimer = 0;
      st.mesh.visible = true;
    });

    const sinY0 = Math.sin(carState.yaw);
    const cosY0 = Math.cos(carState.yaw);
    camPos.set(carState.x - sinY0 * 7.2, RACE_ORIGIN_Y + 3.45, carState.z - cosY0 * 7.2);
    camLook.set(carState.x + sinY0 * 6.5, RACE_ORIGIN_Y + 1.55, carState.z + cosY0 * 6.5);
    fpCamera.position.copy(camPos);
    _lookDummy.position.copy(camPos);
    _lookDummy.lookAt(camLook);
    fpCamera.rotation.setFromQuaternion(_lookDummy.quaternion, "YXZ");
    fpCamera.updateMatrixWorld();
    syncComposerCamera(fpCamera);

    emitHud();
  }

  function clearRunnerEntities() {
    for (const o of runnerObstacles) runnerGroup.remove(o.mesh);
    runnerObstacles.length = 0;
    for (const c of runnerCoins) runnerGroup.remove(c.mesh);
    runnerCoins.length = 0;
    for (const b of runnerBoards) runnerGroup.remove(b.mesh);
    runnerBoards.length = 0;
  }

  function spawnRunnerWave() {
    const spawnZ = -86;
    const roll = Math.random();
    if (roll < 0.42) {
      const freeLane = Math.floor(Math.random() * 3);
      for (let ln = 0; ln < 3; ln++) {
        if (ln === freeLane) {
          for (let k = 0; k < 3; k++) {
            const cm = coinProto.clone();
            cm.position.set(RUNNER_ORIGIN_X + LANE_X[ln], RUNNER_ORIGIN_Y + 0.9, spawnZ - k * 2.5);
            runnerGroup.add(cm);
            runnerCoins.push({ mesh: cm, lane: ln, collected: false });
          }
          // Occasional Surfboard power-up in the clear lane!
          if (Math.random() < 0.16 && runnerBoards.length === 0) {
            const bm = pickupBoardProto.clone();
            bm.position.set(RUNNER_ORIGIN_X + LANE_X[ln], RUNNER_ORIGIN_Y + 0.95, spawnZ - 7.8);
            bm.scale.setScalar(1.15);
            runnerGroup.add(bm);
            runnerBoards.push({ mesh: bm, collected: false });
          }
        } else if (Math.random() < 0.74) {
          const proto = ln === 0 ? trainProtoRed : ln === 1 ? trainProtoBlue : trainProtoTeal;
          const tm = proto.clone();
          tm.position.set(RUNNER_ORIGIN_X + LANE_X[ln], RUNNER_ORIGIN_Y + 0.1, spawnZ);
          runnerGroup.add(tm);
          runnerObstacles.push({ mesh: tm, kind: "train", lane: ln, halfLen: 2.0 });
        }
      }
    } else if (roll < 0.72) {
      const ln = Math.floor(Math.random() * 3);
      const bm = barrierProto.clone();
      bm.position.set(RUNNER_ORIGIN_X + LANE_X[ln], RUNNER_ORIGIN_Y + 0.05, spawnZ);
      runnerGroup.add(bm);
      runnerObstacles.push({ mesh: bm, kind: "barrier", lane: ln, halfLen: 0.65 });

      const cm = coinProto.clone();
      cm.position.set(RUNNER_ORIGIN_X + LANE_X[ln], RUNNER_ORIGIN_Y + 2.15, spawnZ);
      runnerGroup.add(cm);
      runnerCoins.push({ mesh: cm, lane: ln, collected: false });
    } else {
      const ln = Math.floor(Math.random() * 3);
      const am = archProto.clone();
      am.position.set(RUNNER_ORIGIN_X + LANE_X[ln], RUNNER_ORIGIN_Y + 0.05, spawnZ);
      runnerGroup.add(am);
      runnerObstacles.push({ mesh: am, kind: "arch", lane: ln, halfLen: 0.65 });

      const cm = coinProto.clone();
      cm.position.set(RUNNER_ORIGIN_X + LANE_X[ln], RUNNER_ORIGIN_Y + 0.7, spawnZ);
      runnerGroup.add(cm);
      runnerCoins.push({ mesh: cm, lane: ln, collected: false });
    }
  }

  function startSubwayRunner() {
    clearRunnerEntities();
    clearBalloons();
    activeMode = "subway_runner";
    arcadeGroup.visible = true;
    raceWorld.group.visible = false;
    carGroup.visible = false;
    carStarsGroup.visible = false;
    aiCars.forEach((ai) => {
      ai.model.root.visible = false;
    });
    runnerGroup.visible = true;
    balloonGroup.visible = false;

    runnerState.lane = 1;
    runnerState.x = RUNNER_ORIGIN_X + LANE_X[1];
    runnerState.y = RUNNER_ORIGIN_Y;
    runnerState.vy = 0;
    runnerState.slideTimer = 0;
    runnerState.surfTimer = 4.5; // Start with a cool 4.5s Island Surfboard intro!
    runnerState.speed = 12.2;
    runnerState.dist = 0;
    runnerState.coins = 0;
    runnerState.hearts = 3;
    runnerState.invulnTimer = 0;
    runnerState.spawnTimer = 0.75;
    runnerState.gameOver = false;
    runnerState.starsEarned = 0;
    runnerState.combo = 0;
    runnerState.bestCombo = 0;
    runnerState.nearMisses = 0;
    runnerState.nearMilestone5 = false;
    runnerState.nearMilestone15 = false;
    runnerState.milestone500 = false;
    runnerState.milestone1000 = false;
    jumpQueued = 0;
    slideQueued = 0;

    for (let i = 0; i < TRACK_SEG_COUNT; i++) {
      trackSegs[i].position.set(RUNNER_ORIGIN_X, RUNNER_ORIGIN_Y, -i * TRACK_SEG_LEN + 8);
    }

    camPos.set(runnerState.x, RUNNER_ORIGIN_Y + 3.55, 5.5);
    camLook.set(runnerState.x, RUNNER_ORIGIN_Y + 1.45, -14);

    playStarFanfare();
    emitHud();
  }

  function clearBalloons() {
    for (const b of balloonItems) balloonGroup.remove(b.group);
    balloonItems.length = 0;
    for (const p of confettiBurst) confettiGroup.remove(p.mesh);
    confettiBurst.length = 0;
  }

  function spawnBalloon(idx, startLow = true) {
    const col = BALLOON_COLORS[idx % BALLOON_COLORS.length];
    const g = buildBalloonGroup(col.hex, col.name);
    const angle = (idx * 2.3999) % (Math.PI * 2);
    const radius = 3.2 + (idx % 4) * 2.8;
    const x = Math.cos(angle) * radius;
    const z = -2 + Math.sin(angle) * radius;
    const y = startLow ? 1.2 + (idx % 5) * 1.4 : 0.8;
    g.position.set(x, y, z);
    balloonGroup.add(g);
    return {
      group: g,
      color: col.name,
      hex: col.hex,
      x,
      z,
      y,
      speedY: 0.9 + (idx % 4) * 0.25,
      phase: idx * 0.9,
    };
  }

  function pickNextBalloonMission() {
    const previous = balloonState.targetColor;
    let idx = Math.floor(Math.random() * BALLOON_COLORS.length);
    for (let attempt = 0; attempt < 4 && BALLOON_COLORS[idx].name === previous; attempt++) {
      idx = Math.floor(Math.random() * BALLOON_COLORS.length);
    }
    balloonState.targetColor = BALLOON_COLORS[idx].name;
    balloonState.targetCount = 4 + Math.min(4, Math.floor(balloonState.missions / 2));
    balloonState.hits = 0;
  }

  function startBalloonPop() {
    clearRunnerEntities();
    clearBalloons();
    activeMode = "balloon_pop";
    arcadeGroup.visible = true;
    raceWorld.group.visible = false;
    carGroup.visible = false;
    carStarsGroup.visible = false;
    aiCars.forEach((ai) => {
      ai.model.root.visible = false;
    });
    runnerGroup.visible = false;
    balloonGroup.visible = true;

    balloonState.totalPopped = 0;
    balloonState.starsEarned = 0;
    balloonState.combo = 0;
    balloonState.bestStreak = 0;
    balloonState.missions = 0;
    balloonState.roundSec = 45;
    balloonState.gameOver = false;
    pickNextBalloonMission();

    for (let i = 0; i < 14; i++) {
      balloonItems.push(spawnBalloon(i, true));
    }

    camPos.set(0, 6.2, 22);
    camLook.set(0, 4.4, -2);

    playStarFanfare();
    emitHud();
  }

  function stop() {
    if (!activeMode) return;
    activeMode = null;
    arcadeGroup.visible = false;
    raceWorld.group.visible = false;
    carGroup.visible = false;
    carStarsGroup.visible = false;
    aiCars.forEach((ai) => {
      ai.model.root.visible = false;
    });
    runnerGroup.visible = false;
    balloonGroup.visible = false;
    clearRunnerEntities();
    clearBalloons();
    inputs.left = inputs.right = inputs.up = inputs.down = false;
    jumpQueued = 0;
    slideQueued = 0;
    localAvatarRig.root.scale.setScalar(1);
    onHudChange?.(null);
    onExit?.();
  }

  // ─── Input Actions for Touch Buttons / Swipe / Keys ────────────────────────
  function setControlInput(key, active) {
    if (key in inputs) {
      inputs[key] = Boolean(active);
    }
  }

  function triggerRunnerLane(dir) {
    if (activeMode !== "subway_runner" || runnerState.gameOver) return;
    const next = Math.max(0, Math.min(2, runnerState.lane + dir));
    if (next !== runnerState.lane) {
      runnerState.lane = next;
      playArcadeTone(dir < 0 ? 420 : 500, 0.08, "sine", 0.045);
    }
  }

  function triggerRunnerJump() {
    if (activeMode !== "subway_runner" || runnerState.gameOver) return;
    jumpQueued = bufferInput();
  }

  function triggerRunnerSlide() {
    if (activeMode !== "subway_runner" || runnerState.gameOver) return;
    slideQueued = bufferInput();
  }

  function triggerHonk() {
    if (activeMode !== "car_drive") return;
    carState.bounceTimer = 0.25;
    playCarHorn();
  }

  function toggleAutoDrive() {
    if (activeMode !== "car_drive") return;
    carState.autoDrive = !carState.autoDrive;
    playArcadeTone(carState.autoDrive ? 587 : 440, 0.1, "sine", 0.05);
    emitHud();
  }

  function handlePointerTap(ndcX, ndcY) {
    if (activeMode !== "balloon_pop" || balloonState.gameOver) return false;
    balloonRaycaster.setFromCamera({ x: ndcX, y: ndcY }, fpCamera);
    const roots = balloonItems.map((b) => b.group);
    const hits = balloonRaycaster.intersectObjects(roots, true);
    if (!hits || hits.length === 0) return false;

    let hitObj = hits[0].object;
    while (hitObj && hitObj.parent !== balloonGroup) {
      hitObj = hitObj.parent;
    }
    const idx = balloonItems.findIndex((b) => b.group === hitObj);
    if (idx < 0) return false;

    const item = balloonItems[idx];
    let cMat = confettiMaterials.get(item.hex);
    if (!cMat) {
      cMat = new THREE.MeshBasicMaterial({ color: item.hex });
      confettiMaterials.set(item.hex, cMat);
    }
    for (let k = 0; k < 8 && confettiBurst.length < 120; k++) {
      const m = new THREE.Mesh(confettiGeo, cMat);
      m.position.copy(item.group.position);
      confettiGroup.add(m);
      confettiBurst.push({
        mesh: m,
        vx: (Math.random() - 0.5) * 7,
        vy: 1.5 + Math.random() * 4.5,
        vz: (Math.random() - 0.5) * 7,
        life: 0.7,
      });
    }

    const isMatch = item.color === balloonState.targetColor;
    balloonGroup.remove(item.group);
    balloonItems[idx] = spawnBalloon(idx + Math.floor(Math.random() * 4), false);

    if (isMatch) {
      balloonState.hits++;
      balloonState.totalPopped++;
      balloonState.combo++;
      balloonState.bestStreak = Math.max(balloonState.bestStreak, balloonState.combo);
      playBalloonPopSound(balloonState.combo);
      if (balloonState.hits >= balloonState.targetCount) {
        balloonState.starsEarned++;
        balloonState.missions++;
        recordBest("balloon_pop", "missions", balloonState.missions);
        claimMilestone("balloon_pop", `mission_${balloonState.missions}`, `Cleared ${balloonState.missions} balloon missions`);
        onEarnStar?.(`balloon:${balloonState.missions}`);
        playStarFanfare();
        pickNextBalloonMission();
      }
    } else {
      balloonState.combo = 0;
      playArcadeTone(280, 0.12, "sine", 0.045);
    }
    emitHud();
    return true;
  }

  // ─── Per-Frame Step ────────────────────────────────────────────────────────
  function step(dt, t) {
    if (!activeMode) return false;

    if (activeMode === "car_drive") {
      let hudDirty = false;
      const prevCountdown = carState.countdownTimer;
      carState.countdownTimer -= dt;
      if (carState.countdownTimer > 0) {
        const beat = Math.ceil(carState.countdownTimer / 0.55);
        if (beat !== carState.lastCountdownBeat) {
          carState.lastCountdownBeat = beat;
          playCountdownBeep(false);
          hudDirty = true;
        }
      } else if (prevCountdown > 0 && carState.countdownTimer <= 0) {
        playCountdownBeep(true);
        hudDirty = true;
      } else if (prevCountdown > -0.65 && carState.countdownTimer <= -0.65) {
        hudDirty = true;
      }

      const racingLive = carState.countdownTimer <= 0;
      if (carState.boostTimer > 0) {
        carState.boostTimer = Math.max(0, carState.boostTimer - dt);
        if (carState.boostTimer === 0) hudDirty = true;
      }

      const steerIn = (inputs.left ? 1 : 0) - (inputs.right ? 1 : 0);
      if (!racingLive && !carState.raceFinished) {
        // Allow visible front-wheel steering during countdown so arrow keys feel immediately alive
        carState.steer = THREE.MathUtils.damp(carState.steer, steerIn * 0.5, 13, dt);
      }

      if (racingLive && !carState.raceFinished) {
        if (carState.autoDrive && (inputs.down || inputs.up)) {
          carState.autoDrive = false;
          hudDirty = true;
        }
        const gas = inputs.down ? -0.65 : inputs.up || carState.autoDrive ? 1 : 0;

        const trackInfoBefore = findNearestTrackInfo(carState.x, carState.z, carState.lastTheta);
        const onAsphalt = Math.abs(trackInfoBefore.latOffset) <= TRACK_HALF_W + 0.5;
        const boostBonus = carState.boostTimer > 0 ? 6.5 : 0;
        const maxFwd = (onAsphalt ? 18.2 : 14.0) + boostBonus;
        const maxRev = -7.0;
        const targetSpeed = gas > 0 ? maxFwd * gas : gas < 0 ? maxRev : 0;
        const accelRate = carState.boostTimer > 0 ? 9.5 : gas !== 0 ? 6.8 : 3.2;
        carState.speed = THREE.MathUtils.damp(carState.speed, targetSpeed, accelRate, dt);

        carState.steer = THREE.MathUtils.damp(carState.steer, steerIn * 0.5, 14, dt);
        const turnDir = carState.speed >= -0.2 ? 1 : -1;
        const speedFactor =
          Math.abs(carState.speed) > 0.2 ? Math.min(1, Math.abs(carState.speed) / 3.4) : 0.45;
        carState.yaw += steerIn * 2.4 * speedFactor * turnDir * dt;

        // Gentle auto-assist steering only when Auto-Drive is toggled ON and player isn't pressing Left/Right
        if (carState.autoDrive && steerIn === 0 && Math.abs(carState.speed) > 1) {
          const lookAheadF = getTrackFrame(wrapAngle02Pi(trackInfoBefore.theta + 0.18));
          const desiredYaw = Math.atan2(lookAheadF.x - carState.x, lookAheadF.z - carState.z);
          const yawErr = wrapAngleDiff(desiredYaw, carState.yaw);
          carState.yaw += THREE.MathUtils.clamp(yawErr, -1.8 * dt, 1.8 * dt);
        }

        let nx = carState.x + Math.sin(carState.yaw) * carState.speed * dt;
        let nz = carState.z + Math.cos(carState.yaw) * carState.speed * dt;

        // Keep car inside the dedicated Grand Prix Track Island without stalling the player
        const nextInfo = findNearestTrackInfo(nx, nz, trackInfoBefore.theta);
        if (Math.abs(nextInfo.latOffset) > TRACK_MAX_LATERAL) {
          const clampedLat = Math.sign(nextInfo.latOffset) * TRACK_MAX_LATERAL;
          nx = nextInfo.frame.x + nextInfo.frame.nx * clampedLat;
          nz = nextInfo.frame.z + nextInfo.frame.nz * clampedLat;
          const wallYawErr = wrapAngleDiff(nextInfo.frame.yaw, carState.yaw);
          carState.yaw += wallYawErr * 0.1;
          carState.speed *= 0.96;
        }

        carState.x = nx;
        carState.z = nz;

        // Share live race position so other visitors can see a ghost marker.
        racePublishTimer -= dt;
        if (racePublishTimer <= 0) {
          racePublishTimer = 0.2;
          const bus = typeof window !== "undefined" ? window.__geminIslandGameEvents : null;
          if (bus && typeof bus.publish === "function") {
            void bus.publish({
              kind: "position",
              game: "car_drive",
              clientId: bus.clientId,
              x: carState.x,
              z: carState.z,
              yaw: carState.yaw,
              lap: carState.lap,
              rank: carState.rank,
            });
          }
        }

        // Lap & Rank Progress Tracking
        const finalInfo = findNearestTrackInfo(carState.x, carState.z, nextInfo.theta);
        const dTh = wrapAngleDiff(finalInfo.theta, carState.lastTheta);
        carState.lastTheta = finalInfo.theta;
        carState.unwrappedTheta += dTh;
        carState.totalProgress = carState.unwrappedTheta;
        const nextLap = Math.max(1, Math.floor(carState.unwrappedTheta / (Math.PI * 2)) + 1);
        if (nextLap !== carState.lap) {
          carState.lap = nextLap;
          hudDirty = true;
          if (carState.lap > TOTAL_LAPS) {
            carState.raceFinished = true;
            carState.finishRank = carState.rank;
            carState.starsEarned++;
            recordBest("car_drive", "stars", carState.score);
            if (carState.finishRank === 1) {
              claimMilestone("car_drive", "first_win", "Won the Island Grand Prix");
              onEarnStar?.("car:win");
            }
            playRaceVictoryFanfare();
          } else {
            playStarFanfare();
          }
        }

        // Boost Pads check
        for (const bp of raceWorld.boostPads) {
          if (Math.hypot(carState.x - bp.x, carState.z - bp.z) < 2.75) {
            if (carState.boostTimer < 0.8) {
              playBoostSound();
              hudDirty = true;
            }
            carState.boostTimer = 1.6;
          }
        }
      } else if (carState.raceFinished) {
        // Victory cooldown coast
        carState.speed = THREE.MathUtils.damp(carState.speed, 0, 2.5, dt);
        carState.x += Math.sin(carState.yaw) * carState.speed * dt;
        carState.z += Math.cos(carState.yaw) * carState.speed * dt;
      }

      // Step 3 AI Opponent Race Cars
      if (racingLive) {
        for (let i = 0; i < aiCars.length; i++) {
          const ai = aiCars[i];
          // Gentle kid-friendly rubber banding around player progress
          const progGap = carState.totalProgress - ai.totalProgress;
          const rubber = THREE.MathUtils.clamp(progGap * 0.04, -0.055, 0.065);
          const effRate = Math.max(0.24, ai.speedRate + rubber + Math.sin(t * 0.7 + i * 2.1) * 0.025);
          ai.theta = wrapAngle02Pi(ai.theta + effRate * dt);
          ai.totalProgress += effRate * dt;
          const af = getTrackFrame(ai.theta);
          const weave = Math.sin(t * 0.9 + i * 1.9) * 0.85;
          ai.x = af.x + af.nx * (ai.laneOffset + weave);
          ai.z = af.z + af.nz * (ai.laneOffset + weave);
          ai.yaw = af.yaw;
          ai.wheelSpin += effRate * 40 * dt;

          ai.model.root.position.set(ai.x, RACE_ORIGIN_Y + 0.05, ai.z);
          ai.model.root.rotation.set(0, ai.yaw, 0);
          ai.model.wheels.fl.rotation.x = ai.wheelSpin;
          ai.model.wheels.fr.rotation.x = ai.wheelSpin;
          ai.model.wheels.rl.rotation.x = ai.wheelSpin;
          ai.model.wheels.rr.rotation.x = ai.wheelSpin;

          // Friendly car-to-car bump with player
          const dx = carState.x - ai.x;
          const dz = carState.z - ai.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 2.1 && dist > 0.01) {
            const push = (2.1 - dist) * 0.65;
            carState.x += (dx / dist) * push;
            carState.z += (dz / dist) * push;
            if (carState.bounceTimer <= 0) {
              carState.bounceTimer = 0.22;
              playArcadeTone(240, 0.09, "sine", 0.045);
            }
          }
        }
      }

      // Compute Live Standings (1st .. 4th)
      if (!carState.raceFinished) {
        const nextRank = raceRank(
          [carState.totalProgress, ...aiCars.map((ai) => ai.totalProgress)],
          0,
        );
        if (nextRank !== carState.rank) {
          carState.rank = nextRank;
          hudDirty = true;
        }
      }

      carState.bounceTimer = Math.max(0, carState.bounceTimer - dt);
      const hornBounce = carState.bounceTimer > 0 ? Math.sin(carState.bounceTimer * 35) * 0.1 : 0;

      carGroup.position.set(carState.x, RACE_ORIGIN_Y + 0.05 + hornBounce, carState.z);
      carGroup.rotation.set(0, carState.yaw, -carState.steer * 0.12);

      carState.wheelSpin += carState.speed * dt * 2.4;
      carModel.wheels.fl.rotation.set(carState.wheelSpin, carState.steer * 0.7, 0);
      carModel.wheels.fr.rotation.set(carState.wheelSpin, carState.steer * 0.7, 0);
      carModel.wheels.rl.rotation.set(carState.wheelSpin, 0, 0);
      carModel.wheels.rr.rotation.set(carState.wheelSpin, 0, 0);

      // Seat player's customized avatar facing FORWARD (+Z of car) -> yaw + Math.PI cancels applyPose's +PI!
      const cosY = Math.cos(carState.yaw);
      const sinY = Math.sin(carState.yaw);
      localAvatarRig.setFirstPersonMode(false);
      localAvatarRig.root.visible = true;
      localAvatarRig.root.scale.setScalar(1);
      localAvatarRig.root.position.set(
        carState.x + sinY * carModel.seatZ,
        RACE_ORIGIN_Y + 0.05 + carModel.seatY + hornBounce,
        carState.z + cosY * carModel.seatZ,
      );
      localAvatarRig.applyPose({
        dt,
        t,
        yaw: carState.yaw + Math.PI,
        pitch: 0,
        speed: 0,
        anim: "sit",
        jumpY: 0,
        waveTimer: carState.raceFinished || carState.bounceTimer > 0 ? 0.4 : 0,
        isFirstPerson: false,
      });

      // Collect & respawn track stars
      for (let i = 0; i < carStars.length; i++) {
        const st = carStars[i];
        if (st.collected) {
          st.respawnTimer -= dt;
          if (st.respawnTimer <= 0) {
            st.collected = false;
            st.mesh.visible = true;
          }
          continue;
        }
        st.mesh.rotation.y = t * 2.8 + i;
        st.mesh.position.y = RACE_ORIGIN_Y + 0.95 + Math.sin(t * 3 + i) * 0.16;
        if (Math.hypot(carState.x - st.x, carState.z - st.z) < 2.45) {
          st.collected = true;
          st.respawnTimer = 18;
          st.mesh.visible = false;
          carState.score++;
          hudDirty = true;
          playCoinSound(carState.score);
          if (carState.score % 5 === 0) {
            carState.starsEarned++;
            recordBest("car_drive", "stars", carState.score);
            claimMilestone("car_drive", `stars_${carState.score}`, `Collected ${carState.score} race stars`);
            onEarnStar?.(`car:${carState.score}`);
            playStarFanfare();
          }
        }
      }
      if (hudDirty) emitHud();

      // Locked in-place 3rd-person chase cam directly behind the car
      const camDist = 7.2;
      const camHeight = RACE_ORIGIN_Y + 3.45;
      camPos.set(carState.x - sinY * camDist, camHeight, carState.z - cosY * camDist);
      camLook.set(carState.x + sinY * 6.5, RACE_ORIGIN_Y + 1.55, carState.z + cosY * 6.5);

      fpCamera.position.copy(camPos);
      _lookDummy.position.copy(camPos);
      _lookDummy.lookAt(camLook);
      fpCamera.rotation.setFromQuaternion(_lookDummy.quaternion, "YXZ");
      fpCamera.updateMatrixWorld();
      syncComposerCamera(fpCamera);

      skyDome.visible = true;
      skyDome.position.set(carState.x, 0, carState.z);
      oceanMesh.position.set(carState.x, -0.56, carState.z);
      updateTexelSnappedSun(carState.x, carState.z);
      sun.intensity = 2.25;
      hemi.intensity = 1.12;
      return true;
    }

    if (activeMode === "subway_runner") {
      if (!runnerState.gameOver) {
        const surfSpeedMul = runnerState.surfTimer > 0 ? 1.18 : 1.0;
        runnerState.speed = Math.min(20.5, 12.2 + runnerState.dist * 0.012) * surfSpeedMul;
        const dz = runnerState.speed * dt;
        runnerState.dist += dz;
        if (!runnerState.milestone500 && runnerState.dist >= 500) {
          runnerState.milestone500 = true;
          claimMilestone("subway_runner", "distance_500", "Surfed 500m");
          playStarFanfare();
        }
        if (!runnerState.milestone1000 && runnerState.dist >= 1000) {
          runnerState.milestone1000 = true;
          claimMilestone("subway_runner", "distance_1000", "Surfed 1000m");
          playRaceVictoryFanfare();
        }

        if (runnerState.surfTimer > 0) {
          const hadSurf = runnerState.surfTimer > 0;
          runnerState.surfTimer = Math.max(0, runnerState.surfTimer - dt);
          if (hadSurf && runnerState.surfTimer === 0) emitHud();
        }

        const totalLen = TRACK_SEG_COUNT * TRACK_SEG_LEN;
        for (const seg of trackSegs) {
          seg.position.z += dz;
          if (seg.position.z > 14) {
            seg.position.z -= totalLen;
          }
        }

        const targetX = RUNNER_ORIGIN_X + LANE_X[runnerState.lane];
        runnerState.x = THREE.MathUtils.damp(runnerState.x, targetX, 15, dt);

        if (consumeInput(jumpQueued) && runnerState.y <= RUNNER_ORIGIN_Y + 0.05) {
          runnerState.vy = 11.4;
          runnerState.slideTimer = 0;
          jumpQueued = 0;
          playJumpSound();
        } else {
          jumpQueued = decayInput(jumpQueued, dt);
        }

        if (consumeInput(slideQueued)) {
          if (runnerState.y > RUNNER_ORIGIN_Y + 0.2 && runnerState.vy > -10) {
            runnerState.vy = -12;
          }
          runnerState.slideTimer = 0.72;
          slideQueued = 0;
          playSlideSound();
        } else {
          slideQueued = decayInput(slideQueued, dt);
        }

        if (runnerState.slideTimer > 0) {
          runnerState.slideTimer = Math.max(0, runnerState.slideTimer - dt);
        }

        runnerState.y += runnerState.vy * dt;
        runnerState.vy -= 28 * dt;
        if (runnerState.y <= RUNNER_ORIGIN_Y) {
          runnerState.y = RUNNER_ORIGIN_Y;
          runnerState.vy = 0;
        }

        if (runnerState.invulnTimer > 0) {
          runnerState.invulnTimer = Math.max(0, runnerState.invulnTimer - dt);
        }

        runnerState.spawnTimer -= dt;
        if (runnerState.spawnTimer <= 0) {
          spawnRunnerWave();
          runnerState.spawnTimer = Math.max(0.82, 1.42 - (runnerState.speed - 12.2) * 0.04);
        }

        const playerLaneX = runnerState.x;
        const playerRelY = runnerState.y - RUNNER_ORIGIN_Y;
        const isSliding = runnerState.slideTimer > 0 && playerRelY < 0.35;

        // Step coins
        for (let i = runnerCoins.length - 1; i >= 0; i--) {
          const c = runnerCoins[i];
          c.mesh.position.z += dz;
          c.mesh.rotation.y = t * 4.2;
          if (
            !c.collected &&
            Math.abs(c.mesh.position.z) < 1.15 &&
            Math.abs(c.mesh.position.x - playerLaneX) < 1.15 &&
            Math.abs(c.mesh.position.y - RUNNER_ORIGIN_Y - (playerRelY + 0.9)) < 1.45
          ) {
            c.collected = true;
            c.mesh.visible = false;
            runnerState.coins++;
            runnerState.combo++;
            runnerState.bestCombo = Math.max(runnerState.bestCombo, runnerState.combo);
            playCoinSound(runnerState.combo);
            recordBest("subway_runner", "coins", runnerState.coins);
            recordBest("subway_runner", "distance", Math.round(runnerState.dist));
            if (runnerState.coins % 5 === 0) {
              runnerState.starsEarned++;
              claimMilestone("subway_runner", `coins_${runnerState.coins}`, `Collected ${runnerState.coins} surf coins`);
              onEarnStar?.(`runner:${runnerState.coins}`);
            }
            emitHud();
          }
          if (c.mesh.position.z > 12 || c.collected) {
            runnerGroup.remove(c.mesh);
            runnerCoins.splice(i, 1);
          }
        }

        // Step surfboard power-ups
        for (let i = runnerBoards.length - 1; i >= 0; i--) {
          const b = runnerBoards[i];
          b.mesh.position.z += dz;
          b.mesh.rotation.y = t * 2.6;
          if (
            !b.collected &&
            Math.abs(b.mesh.position.z) < 1.3 &&
            Math.abs(b.mesh.position.x - playerLaneX) < 1.25
          ) {
            b.collected = true;
            runnerGroup.remove(b.mesh);
            runnerBoards.splice(i, 1);
            runnerState.surfTimer = 8.0;
            playBoostSound();
            emitHud();
            continue;
          }
          if (b.mesh.position.z > 12) {
            runnerGroup.remove(b.mesh);
            runnerBoards.splice(i, 1);
          }
        }

        // Step obstacles
        for (let i = runnerObstacles.length - 1; i >= 0; i--) {
          const ob = runnerObstacles[i];
          const obSpeed = ob.kind === "train" ? dz * 1.22 : dz;
          ob.mesh.position.z += obSpeed;
          const oz = ob.mesh.position.z;
          const ox = ob.mesh.position.x;

          if (
            runnerState.invulnTimer <= 0 &&
            Math.abs(oz) < ob.halfLen + 0.45 &&
            Math.abs(ox - playerLaneX) < 0.95
          ) {
            let hit = false;
            if (ob.kind === "train") {
              hit = playerRelY < 1.95;
            } else if (ob.kind === "barrier") {
              hit = playerRelY < 0.78;
            } else if (ob.kind === "arch") {
              hit = !isSliding;
            }
            if (hit) {
              if (runnerState.surfTimer > 0) {
                // Hover-Surfboard absorbs the crash safely!
                runnerState.surfTimer = 0;
                runnerState.invulnTimer = 1.4;
                playBumpSound();
              } else {
                runnerState.hearts--;
                runnerState.combo = 0;
                runnerState.invulnTimer = 1.4;
                playBumpSound();
                if (runnerState.hearts <= 0) {
                  runnerState.gameOver = true;
                }
              }
              emitHud();
            }
          }

          // Near miss: clearing a hazard by a hair (or in the next lane) earns
          // a coin and a combo step, once per obstacle as it passes the player.
          if (!ob.nearMissChecked && oz > ob.halfLen + 0.45) {
            ob.nearMissChecked = true;
            if (runnerState.invulnTimer <= 0 && Math.abs(ox - playerLaneX) < 2.8) {
              runnerState.nearMisses++;
              runnerState.coins++;
              runnerState.combo++;
              runnerState.bestCombo = Math.max(runnerState.bestCombo, runnerState.combo);
              playCoinSound(runnerState.combo);
              recordBest("subway_runner", "coins", runnerState.coins);
              if (runnerState.nearMisses === 5 && !runnerState.nearMilestone5) {
                runnerState.nearMilestone5 = true;
                claimMilestone("subway_runner", "near_miss_5", "Five surf near-misses");
              }
              if (runnerState.nearMisses === 15 && !runnerState.nearMilestone15) {
                runnerState.nearMilestone15 = true;
                claimMilestone("subway_runner", "near_miss_15", "Fifteen surf near-misses");
              }
              emitHud();
            }
          }

          if (oz > 14) {
            runnerGroup.remove(ob.mesh);
            runnerObstacles.splice(i, 1);
          }
        }
      }

      // Hero Character & Surfboard Positioning: yaw = 0 makes avatar face -Z down the track!
      const isInvulnBlink = runnerState.invulnTimer > 0 && Math.floor(runnerState.invulnTimer * 12) % 2 === 0;
      const isSlidingNow = runnerState.slideTimer > 0 && runnerState.y <= RUNNER_ORIGIN_Y + 0.25;
      const isSurfing = runnerState.surfTimer > 0 && !runnerState.gameOver;
      const surfHoverLift = isSurfing ? 0.22 + Math.sin(t * 7) * 0.05 : 0;

      playerSurfboard.visible = isSurfing && !isInvulnBlink;
      if (playerSurfboard.visible) {
        playerSurfboard.position.set(runnerState.x, runnerState.y + 0.1 + surfHoverLift * 0.5, 0);
        const targetLaneX = RUNNER_ORIGIN_X + LANE_X[runnerState.lane];
        playerSurfboard.rotation.set(0, 0, (targetLaneX - runnerState.x) * -0.14);
      }

      const relJump = Math.max(0, runnerState.y - RUNNER_ORIGIN_Y);
      const shadowScale = Math.max(0.45, 1 - relJump * 0.22);
      runnerShadowMesh.position.set(runnerState.x, RUNNER_ORIGIN_Y + 0.04, 0);
      runnerShadowMesh.scale.setScalar(shadowScale);

      localAvatarRig.setFirstPersonMode(false);
      localAvatarRig.root.visible = !isInvulnBlink;
      localAvatarRig.root.position.set(runnerState.x, runnerState.y + surfHoverLift, 0);
      localAvatarRig.root.scale.set(1.42, isSlidingNow ? 0.78 : 1.42, 1.42);
      localAvatarRig.applyPose({
        dt,
        t,
        yaw: 0, // Faces -Z (away from camera, running down the track!)
        pitch: 0,
        speed: runnerState.gameOver ? 0 : isSurfing ? 0 : runnerState.speed * 0.85,
        anim: runnerState.gameOver
          ? "idle"
          : runnerState.y > RUNNER_ORIGIN_Y + 0.1
            ? "jump"
            : isSurfing
              ? "idle"
              : "run",
        jumpY: relJump,
        waveTimer: 0,
        isFirstPerson: false,
      });

      const goalX = runnerState.x * 0.65 + RUNNER_ORIGIN_X * 0.35;
      camPos.x = THREE.MathUtils.damp(camPos.x, goalX, 10, dt);
      camPos.y = THREE.MathUtils.damp(camPos.y, RUNNER_ORIGIN_Y + 3.55, 10, dt);
      camPos.z = 5.5;
      camLook.set(camPos.x * 0.88 + RUNNER_ORIGIN_X * 0.12, RUNNER_ORIGIN_Y + 1.45, -14);

      fpCamera.position.copy(camPos);
      _lookDummy.position.copy(camPos);
      _lookDummy.lookAt(camLook);
      fpCamera.rotation.setFromQuaternion(_lookDummy.quaternion, "YXZ");
      fpCamera.updateMatrixWorld();
      syncComposerCamera(fpCamera);

      skyDome.visible = true;
      skyDome.position.set(RUNNER_ORIGIN_X, 0, 0);
      oceanMesh.position.set(RUNNER_ORIGIN_X, -0.56, 0);
      updateTexelSnappedSun(RUNNER_ORIGIN_X, -12);
      sun.intensity = 2.25;
      hemi.intensity = 1.12;
      return true;
    }

    if (activeMode === "balloon_pop") {
      if (!balloonState.gameOver) {
        balloonState.roundSec = Math.max(0, balloonState.roundSec - dt);
        if (balloonState.roundSec <= 0) {
          balloonState.gameOver = true;
          playStarFanfare();
          emitHud();
        }
      }
      for (let i = 0; i < balloonItems.length; i++) {
        const b = balloonItems[i];
        b.y += b.speedY * dt;
        const sway = Math.sin(t * 1.6 + b.phase) * 0.45;
        b.group.position.set(b.x + sway, b.y, b.z + Math.cos(t * 1.3 + b.phase) * 0.35);
        b.group.rotation.y = t * 0.6 + b.phase;
        if (b.y > 14.5) {
          balloonGroup.remove(b.group);
          balloonItems[i] = spawnBalloon(i + Math.floor(Math.random() * 4), false);
        }
      }

      for (let i = confettiBurst.length - 1; i >= 0; i--) {
        const p = confettiBurst[i];
        p.life -= dt;
        p.vy -= 14 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.x += dt * 8;
        p.mesh.rotation.y += dt * 7;
        if (p.life <= 0) {
          confettiGroup.remove(p.mesh);
          confettiBurst.splice(i, 1);
        }
      }

      localAvatarRig.root.visible = false;
      camPos.set(Math.sin(t * 0.14) * 2.5, 6.4, 21.5);
      camLook.set(0, 4.6, -2);
      fpCamera.position.copy(camPos);
      _lookDummy.position.copy(camPos);
      _lookDummy.lookAt(camLook);
      fpCamera.rotation.setFromQuaternion(_lookDummy.quaternion, "YXZ");
      fpCamera.updateMatrixWorld();
      syncComposerCamera(fpCamera);

      skyDome.visible = true;
      skyDome.position.set(0, 0, 0);
      oceanMesh.position.set(0, -0.56, 0);
      grassUniforms.uFocusXZ.value.set(0, 0);
      updateTexelSnappedSun(0, 0);
      sun.intensity = 2.25;
      hemi.intensity = 1.12;
      return true;
    }

    return false;
  }

  function setRemoteRacers(entries) {
    const list = Array.isArray(entries) ? entries : [];
    const seen = new Set();
    for (const entry of list) {
      const id = String(entry?.clientId || entry?.name || "remote");
      seen.add(id);
      let marker = remoteRacerMarkers.get(id);
      if (!marker) {
        marker = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.6, 1.5),
          new THREE.MeshBasicMaterial({ color: "#4ce8e0", transparent: true, opacity: 0.62 }),
        );
        raceWorld.group.add(marker);
        remoteRacerMarkers.set(id, marker);
      }
      marker.position.set(Number(entry?.x) || 0, RACE_ORIGIN_Y + 0.5, Number(entry?.z) || 0);
      marker.rotation.y = Number(entry?.yaw) || 0;
    }
    for (const [id, marker] of remoteRacerMarkers) {
      if (seen.has(id)) continue;
      raceWorld.group.remove(marker);
      marker.geometry.dispose();
      marker.material.dispose();
      remoteRacerMarkers.delete(id);
    }
  }

  return {
    isActive: () => activeMode !== null,
    getActiveMode: () => activeMode,
    setRemoteRacers,
    startCarDrive,
    startSubwayRunner,
    startBalloonPop,
    stop,
    step,
    setControlInput,
    triggerRunnerLane,
    triggerRunnerJump,
    triggerRunnerSlide,
    triggerHonk,
    toggleAutoDrive,
    handlePointerTap,
  };
}
