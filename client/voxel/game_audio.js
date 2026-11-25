// Shared WebAudio bus for every in-world game and arcade mode.
// One master gain makes mute/volume work everywhere; optional source positions let
// offscreen games fade out instead of playing at full volume from across the island.

import { getSetting, setSetting } from "../game_progress.js";

const MAX_AUDIBLE_DISTANCE = 72;

let audioCtx = null;
let masterGain = null;
let volume = Number(getSetting("audioVolume", 0.8));
let muted = Boolean(getSetting("audioMuted", false));
let listener = null;
let currentSource = null;

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function getGameAudioSettings() {
  return { muted, volume };
}

export function setGameAudioVolume(value) {
  volume = clamp01(value);
  setSetting("audioVolume", volume);
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : volume, audioCtx.currentTime, 0.02);
  }
}

export function setGameAudioMuted(value) {
  muted = Boolean(value);
  setSetting("audioMuted", muted);
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : volume, audioCtx.currentTime, 0.02);
  }
}

export function ensureGameAudio() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = muted ? 0 : volume;
      masterGain.connect(audioCtx.destination);
    } catch {
      audioCtx = null;
      masterGain = null;
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isGameAudioReady() {
  return Boolean(audioCtx && audioCtx.state === "running");
}

export function setGameAudioListener(x, z) {
  if (Number.isFinite(x) && Number.isFinite(z)) listener = { x, z };
}

export function setGameAudioSource(source) {
  currentSource = source && Number.isFinite(source.x) && Number.isFinite(source.z) ? source : null;
}

export function clearGameAudioSource() {
  currentSource = null;
}

/** Run a controller callback with its creation position used for audio falloff. */
export function withGameAudioSource(source, callback) {
  const previous = currentSource;
  setGameAudioSource(source);
  try {
    return callback();
  } finally {
    currentSource = previous;
  }
}

function gainMultiplier() {
  if (muted) return 0;
  if (!currentSource || !listener) return 1;
  const dx = currentSource.x - listener.x;
  const dz = currentSource.z - listener.z;
  const distance = Math.hypot(dx, dz);
  if (distance >= MAX_AUDIBLE_DISTANCE) return 0;
  const falloff = 1 - distance / MAX_AUDIBLE_DISTANCE;
  return Math.max(0.04, falloff * falloff);
}

export function playGameTone(
  freq = 440,
  dur = 0.14,
  type = "triangle",
  gainPeak = 0.075,
  delaySec = 0,
) {
  if (!audioCtx || audioCtx.state !== "running" || !masterGain) return;
  const spatial = gainMultiplier();
  if (spatial <= 0) return;
  try {
    const t0 = audioCtx.currentTime + delaySec;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freq), t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainPeak * spatial), t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    // Ignore transient WebAudio errors.
  }
}

export function playGameSweep(fromFreq = 280, toFreq = 620, dur = 0.16, type = "sine", gainPeak = 0.075) {
  if (!audioCtx || audioCtx.state !== "running" || !masterGain) return;
  const spatial = gainMultiplier();
  if (spatial <= 0) return;
  try {
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, fromFreq), t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, toFreq), t0 + dur * 0.85);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainPeak * spatial), t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    // Ignore transient WebAudio errors.
  }
}

export function playGameArpeggio(
  freqs,
  stepSec = 0.075,
  dur = 0.18,
  type = "triangle",
  gainPeak = 0.07,
) {
  if (!Array.isArray(freqs)) return;
  freqs.forEach((freq, idx) => playGameTone(freq, dur, type, gainPeak, idx * stepSec));
}

export function playGameNoise(dur = 0.16, gainPeak = 0.055, delaySec = 0) {
  if (!audioCtx || audioCtx.state !== "running" || !masterGain) return;
  const spatial = gainMultiplier();
  if (spatial <= 0) return;
  try {
    const sr = audioCtx.sampleRate;
    const len = Math.max(256, Math.floor(sr * dur));
    const buf = audioCtx.createBuffer(1, len, sr);
    const channel = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      channel[i] = (Math.random() * 2 - 1) * Math.exp((-i / len) * 3.2);
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    const t0 = audioCtx.currentTime + delaySec;
    gain.gain.setValueAtTime(Math.max(0.0002, gainPeak * spatial), t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(gain);
    gain.connect(masterGain);
    src.start(t0);
  } catch {
    // Ignore transient WebAudio errors.
  }
}
