import assert from "node:assert/strict";
import test from "node:test";

import { chooseLocalMove, pickQuip } from "../client/voxel/minigame_ai_local.js";

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

function connectFourWinner(grid) {
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
  return 0;
}

test("hard tic-tac-toe opponent never loses against random moves", () => {
  for (let game = 0; game < 60; game++) {
    const board = new Array(9).fill(0);
    let winner = 0;
    for (let turn = 0; turn < 9 && !winner; turn++) {
      const legal = board.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
      const humanMove = legal[Math.floor(Math.random() * legal.length)];
      board[humanMove] = 1;
      winner = tttWinner(board);
      if (winner) break;
      const aiMove = chooseLocalMove("tic_tac_toe", board, "hard");
      assert.equal(board[aiMove], 0, "AI must pick an empty cell");
      board[aiMove] = 2;
      winner = tttWinner(board);
    }
    assert.notEqual(winner, 1, "hard AI should never lose");
  }
});

test("local AI takes an immediate tic-tac-toe win", () => {
  const board = [2, 2, 0, 1, 1, 0, 0, 0, 0];
  assert.equal(chooseLocalMove("tic_tac_toe", board, "hard"), 2);
});

test("local Connect Four opponent blocks an immediate threat and stays legal", () => {
  const grid = Array.from({ length: 7 }, () => new Array(6).fill(0));
  grid[0][0] = 1;
  grid[1][0] = 1;
  grid[2][0] = 1;
  const move = chooseLocalMove("connect_four", grid, "hard");
  assert.equal(move, 3, "must block the open four");
  grid[move][grid[move].indexOf(0)] = 2;
  assert.equal(connectFourWinner(grid), 0);
});

test("quips are only produced for local play", () => {
  assert.equal(typeof pickQuip("tic_tac_toe", "normal"), "string");
  assert.equal(pickQuip("tic_tac_toe", "gemini"), "");
});

test("game progress keeps higher bests, lower bests and one-time achievements", async () => {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  };
  const progress = await import("../client/game_progress.js");

  assert.equal(progress.recordBest("runner", "coins", 12), true);
  assert.equal(progress.recordBest("runner", "coins", 8), false);
  assert.equal(progress.getBest("runner", "coins"), 12);

  assert.equal(progress.recordLowest("lights_out", "moves", 7), true);
  assert.equal(progress.recordLowest("lights_out", "moves", 9), false);
  assert.equal(progress.getLowest("lights_out", "moves"), 7);

  assert.equal(progress.awardAchievement("car:win", "Won a race"), true);
  assert.equal(progress.awardAchievement("car:win", "Won a race"), false);
  assert.equal(progress.claimMilestone("balloon_pop", "mission_1"), true);
  assert.equal(progress.claimMilestone("balloon_pop", "mission_1"), false);
  assert.equal(progress.getAchievementCount(), 2);

  progress.addRemoteScore("runner", { name: "Ada", score: 30 });
  progress.addRemoteScore("runner", { name: "Bola", score: 45 });
  assert.equal(progress.getLeaderboard("runner")[0].name, "Bola");

  assert.equal(progress.recordLastResult("subway_runner", { score: 42, label: "42 coins" }), true);
  assert.equal(progress.getLastResult("subway_runner").score, 42);
  assert.equal(progress.recordLastResult("subway_runner", { score: 11, label: "11 coins" }), true);
  assert.equal(progress.getLastResult("subway_runner").score, 11, "last result must be the most recent round");
});
