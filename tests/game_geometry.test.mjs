import assert from "node:assert/strict";
import test from "node:test";

import { auditInteractiveGameGeometry } from "../src/voxel_audit.ts";

function blueprint(kind, ops) {
  return {
    version: 1,
    name: `Test ${kind}`,
    description: "",
    category: "play",
    scaleClass: "medium",
    palette: { stone: "#888888" },
    ops,
    parts: [],
    interaction: { kind, label: kind },
    stats: { voxels: ops.length },
  };
}

test("authored open-top game tables pass geometry validation", () => {
  const report = auditInteractiveGameGeometry(
    blueprint("tic_tac_toe", [
      { op: "box", x0: -4, y0: 0, z0: -4, x1: 4, y1: 1, z1: 4, color: "stone" },
    ]),
  );
  assert.equal(report.kind, "tic_tac_toe");
  assert.equal(report.ok, true, report.issues.join("; "));
  assert.equal(report.filledCenterColumns, 49);
});

test("a roof over a board game is rejected", () => {
  const report = auditInteractiveGameGeometry(
    blueprint("lights_out", [
      { op: "box", x0: -4, y0: 0, z0: -4, x1: 4, y1: 1, z1: 4, color: "stone" },
      { op: "box", x0: -4, y0: 14, z0: -4, x1: 4, y1: 15, z1: 4, color: "stone" },
    ]),
  );
  assert.equal(report.ok, false);
  assert.ok(report.issues.some((issue) => issue.includes("roof")));
});

test("a blocked front face is rejected for mounted frames", () => {
  const report = auditInteractiveGameGeometry(
    blueprint("connect_four", [
      { op: "box", x0: -7, y0: 2, z0: 4, x1: 7, y1: 13, z1: 11, color: "stone" },
    ]),
  );
  assert.equal(report.ok, false);
  assert.ok(report.issues.some((issue) => issue.includes("front face")));
});
