// Dependency-free rules shared by the voxel mini-games and their tests.
// Keeping the pure logic here lets win detection, laps, buffered inputs and
// Lights Out puzzles be verified without booting WebGL or WebAudio.

export const TIC_TAC_TOE_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function findTicTacToeWinner(board) {
  if (!Array.isArray(board) || board.length !== 9) return null;
  for (const line of TIC_TAC_TOE_LINES) {
    const [a, b, c] = line;
    if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every((cell) => cell !== 0)) return { winner: 3, line: null };
  return null;
}

/** grid[col][row], seven columns by six rows, row 0 at the bottom. */
export function findConnectFourWinner(grid) {
  if (!Array.isArray(grid) || grid.length !== 7) return null;
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  for (let c = 0; c < 7; c++) {
    for (let r = 0; r < 6; r++) {
      const who = grid[c]?.[r];
      if (!who) continue;
      for (const [dc, dr] of dirs) {
        const cells = [[c, r]];
        for (let k = 1; k < 4; k++) {
          const nc = c + dc * k;
          const nr = r + dr * k;
          if (nc < 0 || nc >= 7 || nr < 0 || nr >= 6 || grid[nc]?.[nr] !== who) break;
          cells.push([nc, nr]);
        }
        if (cells.length === 4) return { winner: who, cells };
      }
    }
  }
  if (grid.every((col) => col[5] !== 0)) return { winner: 3, cells: null };
  return null;
}

export function lightsOutIndex(size, row, col) {
  return row * size + col;
}

export function toggleLightsOutCell(board, size, row, col) {
  const next = Array.from(board);
  for (const [dr, dc] of [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r >= size || c < 0 || c >= size) continue;
    const i = lightsOutIndex(size, r, c);
    next[i] = next[i] ? 0 : 1;
  }
  return next;
}

/** Deterministic solvable scramble: start lit, toggle seeded cells. */
export function createLightsOutBoard(size = 3, scramble = [0, 4, 8, 1]) {
  let board = Array(size * size).fill(1);
  for (const move of scramble) {
    const i = Number(move);
    if (!Number.isInteger(i) || i < 0 || i >= board.length) continue;
    board = toggleLightsOutCell(board, size, Math.floor(i / size), i % size);
  }
  return board;
}

export function isLightsOutSolved(board) {
  return Array.isArray(board) && board.every((cell) => cell === 1);
}

/** Wrap-aware lap progress so crossing the start line never reports -1 lap. */
export function unwrapAngle(previous, current) {
  const TWO_PI = Math.PI * 2;
  let delta = (current - previous) % TWO_PI;
  if (delta > Math.PI) delta -= TWO_PI;
  if (delta < -Math.PI) delta += TWO_PI;
  return delta;
}

export function raceRank(progress, playerIndex = 0) {
  if (!Array.isArray(progress)) return 1;
  const mine = Number(progress[playerIndex]) || 0;
  return progress.reduce((rank, value, index) => {
    if (index === playerIndex) return rank;
    return (Number(value) || 0) > mine ? rank + 1 : rank;
  }, 1);
}

export const RUNNER_INPUT_WINDOW_SEC = 0.14;

export function bufferInput(seconds = RUNNER_INPUT_WINDOW_SEC) {
  return Math.max(0, Math.min(1, Number(seconds) || RUNNER_INPUT_WINDOW_SEC));
}

export function decayInput(remaining, dt) {
  return Math.max(0, (Number(remaining) || 0) - Math.max(0, Number(dt) || 0));
}

export function consumeInput(remaining) {
  return (Number(remaining) || 0) > 0;
}

/** Stable reward keys stop repeat pickups and achievements from being farmed. */
export function rewardKey(gameId, value) {
  return `${String(gameId).replace(/[^a-z0-9_:-]/gi, "")}:${Math.max(0, Math.round(Number(value) || 0))}`;
}

export function shouldAwardReward(seen, key) {
  if (!key || (seen instanceof Set && seen.has(key))) return false;
  if (seen instanceof Set) seen.add(key);
  return true;
}
