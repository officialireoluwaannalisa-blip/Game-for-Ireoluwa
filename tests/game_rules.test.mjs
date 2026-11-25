import assert from "node:assert/strict";
import test from "node:test";

import {
  RUNNER_INPUT_WINDOW_SEC,
  bufferInput,
  consumeInput,
  createLightsOutBoard,
  decayInput,
  findConnectFourWinner,
  findTicTacToeWinner,
  isLightsOutSolved,
  raceRank,
  rewardKey,
  shouldAwardReward,
  toggleLightsOutCell,
  unwrapAngle,
} from "../client/voxel/game_rules.js";

test("tic-tac-toe detects horizontal, diagonal and draw outcomes", () => {
  assert.deepEqual(findTicTacToeWinner([1, 1, 1, 2, 2, 0, 0, 0, 0]), {
    winner: 1,
    line: [0, 1, 2],
  });
  assert.equal(findTicTacToeWinner([1, 0, 0, 0, 1, 0, 0, 0, 1]).winner, 1);
  assert.equal(findTicTacToeWinner([1, 2, 1, 1, 2, 2, 2, 1, 1]).winner, 3);
  assert.equal(findTicTacToeWinner([1, 0, 0, 0, 2, 0, 0, 0, 0]), null);
});

test("connect four detects vertical and diagonal wins without wrapping", () => {
  const grid = Array.from({ length: 7 }, () => new Array(6).fill(0));
  for (let r = 0; r < 4; r++) grid[3][r] = 2;
  assert.equal(findConnectFourWinner(grid).winner, 2);

  const diag = Array.from({ length: 7 }, () => new Array(6).fill(0));
  [[0, 0], [1, 1], [2, 2], [3, 3]].forEach(([c, r]) => {
    diag[c][r] = 1;
  });
  assert.equal(findConnectFourWinner(diag).winner, 1);
  assert.equal(findConnectFourWinner(grid).cells.length, 4);
});

test("Lights Out scramble is always solvable and toggling twice is a no-op", () => {
  const scramble = [0, 4, 8, 1];
  let board = createLightsOutBoard(3, scramble);
  assert.equal(isLightsOutSolved(board), false);
  for (const idx of scramble) {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    board = toggleLightsOutCell(board, 3, row, col);
  }
  assert.equal(isLightsOutSolved(board), true);

  const once = toggleLightsOutCell(board, 3, 1, 1);
  const twice = toggleLightsOutCell(once, 3, 1, 1);
  assert.deepEqual(twice, board);
});

test("race progress wraps cleanly and rank follows unwrapped totals", () => {
  assert.ok(Math.abs(unwrapAngle(Math.PI * 2 - 0.05, 0.05) - 0.1) < 1e-9);
  assert.ok(Math.abs(unwrapAngle(0.05, Math.PI * 2 - 0.05) + 0.1) < 1e-9);
  assert.equal(raceRank([0.95, 1.2, 0.5, -0.045], 0), 2);
  assert.equal(raceRank([-0.045, 0.1, 0.2, 0.4], 0), 4);
});

test("runner inputs buffer for 0.14s and expire once", () => {
  const queued = bufferInput();
  assert.equal(queued, RUNNER_INPUT_WINDOW_SEC);
  assert.equal(consumeInput(queued), true);
  assert.equal(consumeInput(0), false);
  assert.equal(decayInput(queued, 0.2), 0);
});

test("reward keys dedupe repeat pickups and achievements", () => {
  const seen = new Set();
  assert.equal(shouldAwardReward(seen, rewardKey("runner", 10)), true);
  assert.equal(shouldAwardReward(seen, rewardKey("runner", 10)), false);
  assert.equal(rewardKey("balloon:pop", 3), "balloon:pop:3");
});
