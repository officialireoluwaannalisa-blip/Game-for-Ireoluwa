// Shared, dependency-free game progress store.
// Keeps per-game personal bests, achievement IDs and audio/AI preferences in one
// localStorage record so every game surface (arcade, in-world boards, menu) agrees.

const STORAGE_KEY = "geminisland_game_progress_v1";

const DEFAULT_STATE = {
  bests: {},
  achievements: {},
  settings: { audioMuted: false, audioVolume: 0.8, aiDifficulty: "normal", boardMode: "local" },
  leaderboard: {},
  lastResults: {},
};

const listeners = new Set();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeState(raw) {
  const src = isPlainObject(raw) ? raw : {};
  return {
    bests: isPlainObject(src.bests) ? src.bests : {},
    achievements: isPlainObject(src.achievements) ? src.achievements : {},
    settings: {
      ...DEFAULT_STATE.settings,
      ...(isPlainObject(src.settings) ? src.settings : {}),
    },
    leaderboard: isPlainObject(src.leaderboard) ? src.leaderboard : {},
    lastResults: isPlainObject(src.lastResults) ? src.lastResults : {},
  };
}

let state = (() => {
  try {
    if (typeof localStorage === "undefined") return clone(DEFAULT_STATE);
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : clone(DEFAULT_STATE);
  } catch {
    return clone(DEFAULT_STATE);
  }
})();

function save() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Private browsing / quota errors: keep the in-memory copy working.
  }
  for (const listener of listeners) {
    try {
      listener(getProgress());
    } catch {
      // Listener failures must never break a game loop.
    }
  }
}

function safeGameId(gameId) {
  return String(gameId || "").replace(/[^a-zA-Z0-9_:-]/g, "").slice(0, 64) || "unknown";
}

export function getProgress() {
  return clone(state);
}

export function subscribeProgress(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBest(gameId, metric = "score") {
  const bucket = state.bests[safeGameId(gameId)];
  const value = bucket && bucket[safeMetric(metric)];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function safeMetric(metric) {
  return String(metric || "score").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "score";
}

/** Store a higher-is-better record. Returns true when the record improved. */
export function recordBest(gameId, metric, value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return false;
  const id = safeGameId(gameId);
  const key = safeMetric(metric);
  const current = getBest(id, key);
  if (num <= current) return false;
  state.bests[id] = { ...(state.bests[id] || {}), [key]: Math.round(num * 100) / 100 };
  save();
  return true;
}

/** Store a lower-is-better record (moves, time). Returns true when improved. */
export function recordLowest(gameId, metric, value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return false;
  const id = safeGameId(gameId);
  const key = safeMetric(metric);
  const bucket = state.bests[id] || {};
  const current = bucket[`min_${key}`];
  if (typeof current === "number" && current <= num) return false;
  state.bests[id] = { ...bucket, [`min_${key}`]: Math.round(num * 100) / 100 };
  save();
  return true;
}

export function getLowest(gameId, metric = "moves") {
  const bucket = state.bests[safeGameId(gameId)];
  const value = bucket && bucket[`min_${safeMetric(metric)}`];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function hasAchievement(achievementId) {
  return Boolean(state.achievements[safeGameId(achievementId)]);
}

/** One-time achievement. Returns true only the first time it is earned. */
export function awardAchievement(achievementId, label = "") {
  const id = safeGameId(achievementId);
  if (state.achievements[id]) return false;
  state.achievements[id] = {
    at: Date.now(),
    label: String(label || id).slice(0, 80),
  };
  save();
  return true;
}

/** Milestone check without awarding a repeatable achievement every frame. */
export function claimMilestone(gameId, tier, label = "") {
  return awardAchievement(`${safeGameId(gameId)}:${safeMetric(String(tier))}`, label);
}

/** Most recent completed round, kept for "How to play" cards and replay prompts. */
export function getLastResult(gameId) {
  const entry = state.lastResults[safeGameId(gameId)];
  return isPlainObject(entry) ? clone(entry) : null;
}

export function recordLastResult(gameId, result) {
  const src = isPlainObject(result) ? result : {};
  const score = Number(src.score);
  state.lastResults[safeGameId(gameId)] = {
    score: Number.isFinite(score) ? Math.round(score * 100) / 100 : 0,
    label: String(src.label || "Last round").slice(0, 120),
    at: Date.now(),
  };
  save();
  return true;
}

export function getSetting(key, fallback) {
  const value = state.settings[safeMetric(key)];
  return value === undefined ? fallback : value;
}

export function setSetting(key, value) {
  state.settings[safeMetric(key)] = value;
  save();
}

export function getAchievementCount() {
  return Object.keys(state.achievements).length;
}

/** Locally cached top scores received from other visitors. */
export function getLeaderboard(gameId, limit = 5) {
  const rows = state.leaderboard[safeGameId(gameId)];
  return Array.isArray(rows) ? rows.slice(0, limit) : [];
}

export function addRemoteScore(gameId, entry) {
  const id = safeGameId(gameId);
  const score = Number(entry?.score);
  if (!Number.isFinite(score)) return false;
  const row = {
    name: String(entry?.name || "Explorer").slice(0, 16),
    score: Math.max(0, Math.round(score)),
    at: Date.now(),
  };
  const rows = [
    row,
    ...(Array.isArray(state.leaderboard[id]) ? state.leaderboard[id] : []).filter(
      (r) => r && r.name !== row.name,
    ),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  state.leaderboard[id] = rows;
  save();
  return true;
}

export function resetGameProgress() {
  state = clone(DEFAULT_STATE);
  save();
}
