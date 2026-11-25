// Instant, deterministic opponents for Naughts & Crosses and Connect Four.
// Gemini stays available as an optional "boss" style, but ordinary games never
// need to wait on a network round trip.

export const AI_DIFFICULTIES = ["easy", "normal", "hard", "gemini"];

function safeDifficulty(value) {
  return AI_DIFFICULTIES.includes(value) ? value : "normal";
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)] ?? items[0] ?? -1;
}

// ─── Naughts & Crosses ────────────────────────────────────────────────────────
const TTT_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function tttWinner(board) {
  for (const [a, b, c] of TTT_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? 3 : 0;
}

function tttMinimax(board, player, depth) {
  const winner = tttWinner(board);
  if (winner) {
    if (winner === 2) return 10 - depth;
    if (winner === 1) return depth - 10;
    return 0;
  }

  if (player === 2) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = 2;
      best = Math.max(best, tttMinimax(board, 1, depth + 1));
      board[i] = 0;
    }
    return best;
  }

  let best = Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = 1;
    best = Math.min(best, tttMinimax(board, 2, depth + 1));
    board[i] = 0;
  }
  return best;
}

function chooseTicTacToe(rawBoard, difficulty) {
  const board = Array.from({ length: 9 }, (_, i) => Number(rawBoard?.[i]) || 0);
  const legal = board.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  if (!legal.length) return -1;

  if (difficulty === "easy" && Math.random() < 0.38) return randomChoice(legal);

  let bestScore = -Infinity;
  let bestMoves = [];
  // Small preference order keeps ties visually sensible (centre, corners, edges).
  const ordered = [4, 0, 2, 6, 8, 1, 3, 5, 7].filter((i) => board[i] === 0);
  for (const move of ordered) {
    board[move] = 2;
    const score = tttMinimax(board, 1, 1);
    board[move] = 0;
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }
  return randomChoice(bestMoves);
}

// ─── Connect Four ─────────────────────────────────────────────────────────────
function c4Winner(grid) {
  for (let c = 0; c < 7; c++) {
    for (let r = 0; r < 6; r++) {
      const who = grid[c][r];
      if (!who) continue;
      for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        let count = 1;
        while (
          count < 4 &&
          c + dc * count >= 0 && c + dc * count < 7 &&
          r + dr * count >= 0 && r + dr * count < 6 &&
          grid[c + dc * count][r + dr * count] === who
        ) count++;
        if (count === 4) return who;
      }
    }
  }
  return grid.every((col) => col[5] !== 0) ? 3 : 0;
}

function c4Heuristic(grid, aiPlayer) {
  const human = aiPlayer === 1 ? 2 : 1;
  let score = 0;
  for (let c = 0; c < 7; c++) {
    for (let r = 0; r < 6; r++) {
      if (grid[c][r] !== aiPlayer) continue;
      score += c === 3 ? 6 : c === 2 || c === 4 ? 3 : 1;
    }
  }
  const windows = [];
  for (let c = 0; c < 7; c++) {
    for (let r = 0; r < 6; r++) {
      if (c <= 3) windows.push([[c, r], [c + 1, r], [c + 2, r], [c + 3, r]]);
      if (r <= 2) windows.push([[c, r], [c, r + 1], [c, r + 2], [c, r + 3]]);
      if (c <= 3 && r <= 2) windows.push([[c, r], [c + 1, r + 1], [c + 2, r + 2], [c + 3, r + 3]]);
      if (c <= 3 && r >= 3) windows.push([[c, r], [c + 1, r - 1], [c + 2, r - 2], [c + 3, r - 3]]);
    }
  }
  for (const window of windows) {
    let mine = 0;
    let theirs = 0;
    for (const [c, r] of window) {
      if (grid[c][r] === aiPlayer) mine++;
      else if (grid[c][r] === human) theirs++;
    }
    if (mine && !theirs) score += [0, 1, 7, 36][mine];
    if (theirs && !mine) score -= [0, 1, 9, 54][theirs];
  }
  return score;
}

function c4Minimax(grid, depth, alpha, beta, maximizing, aiPlayer, memo) {
  const winner = c4Winner(grid);
  if (winner === aiPlayer) return 1_000_000 + depth;
  if (winner && winner !== 3) return -1_000_000 - depth;
  if (winner === 3) return 0;
  if (depth === 0) return c4Heuristic(grid, aiPlayer);

  const signature = `${grid.map((col) => col.join("")).join("/")}|${maximizing}|${depth}`;
  if (memo.has(signature)) return memo.get(signature);

  const order = [3, 2, 4, 1, 5, 0, 6];
  if (maximizing) {
    let best = -Infinity;
    for (const c of order) {
      const r = grid[c].indexOf(0);
      if (r < 0) continue;
      grid[c][r] = aiPlayer;
      best = Math.max(best, c4Minimax(grid, depth - 1, alpha, beta, false, aiPlayer, memo));
      grid[c][r] = 0;
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    memo.set(signature, best);
    return best;
  }

  let best = Infinity;
  const human = aiPlayer === 1 ? 2 : 1;
  for (const c of order) {
    const r = grid[c].indexOf(0);
    if (r < 0) continue;
    grid[c][r] = human;
    best = Math.min(best, c4Minimax(grid, depth - 1, alpha, beta, true, aiPlayer, memo));
    grid[c][r] = 0;
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  memo.set(signature, best);
  return best;
}

function chooseConnectFour(rawGrid, difficulty) {
  const grid = Array.from({ length: 7 }, (_, c) =>
    Array.from({ length: 6 }, (_, r) => Number(rawGrid?.[c]?.[r]) || 0),
  );
  const legal = [3, 2, 4, 1, 5, 0, 6].filter((c) => grid[c].includes(0));
  if (!legal.length) return -1;

  const depth = difficulty === "easy" ? 2 : difficulty === "hard" ? 6 : 4;
  if (difficulty === "easy" && Math.random() < 0.25) return randomChoice(legal);

  const memo = new Map();
  let bestScore = -Infinity;
  let bestMoves = [];
  for (const c of legal) {
    const r = grid[c].indexOf(0);
    grid[c][r] = 2;
    const score = c4Minimax(grid, depth - 1, -Infinity, Infinity, false, 2, memo);
    grid[c][r] = 0;
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [c];
    } else if (score === bestScore) {
      bestMoves.push(c);
    }
  }
  return randomChoice(bestMoves);
}

const QUIPS = {
  tic_tac_toe: ["Neat move!", "Island tactics!", "Nice one!", "Your turn, explorer!"],
  connect_four: ["Dropping in!", "Centre stage!", "Good drop!", "Four ahead!"],
};

export function pickQuip(game, difficulty = "normal") {
  if (difficulty === "gemini") return "";
  return randomChoice(QUIPS[game] || ["Nice play!"]);
}

/**
 * @param {"tic_tac_toe"|"connect_four"} game
 * @param {number[]|number[][]} state
 * @param {"easy"|"normal"|"hard"|"gemini"} difficulty
 */
export function chooseLocalMove(game, state, difficulty = "normal") {
  const tier = safeDifficulty(difficulty);
  if (game === "tic_tac_toe") return chooseTicTacToe(state, tier);
  if (game === "connect_four") return chooseConnectFour(state, tier);
  return -1;
}
