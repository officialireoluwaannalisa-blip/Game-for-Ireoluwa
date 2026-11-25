import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { filterWorldCollectionsByPolicy } from "./src/content_policy";

/**
 * Emits /world-snapshot.json — the bundled live-world seed with the island's
 * content policy applied — so static hosts (the Vercel deployment, which has no
 * /api/world) can still render the full island, its sign with the real
 * contribution count and every kid-safe creation. The live dev/preview server
 * never needs it; /api/world wins whenever it is reachable.
 */
function worldSnapshotPlugin(): Plugin {
  return {
    name: "geminisland-world-snapshot",
    apply: "build",
    generateBundle() {
      const seedPath = fileURLToPath(new URL("./src/data/live_world_seed.json", import.meta.url));
      const raw = JSON.parse(fs.readFileSync(seedPath, "utf8"));
      const filtered = filterWorldCollectionsByPolicy({
        creations: Array.isArray(raw.creations) ? raw.creations : [],
        paths: Array.isArray(raw.paths) ? raw.paths : [],
        props: Array.isArray(raw.props) ? raw.props : [],
      });
      const contributionCount = filtered.creations.filter(
        (c) => c && !c.isSeed && !c.isCompanion,
      ).length;
      const snapshot = {
        version: Number(raw.version) || 1,
        creations: filtered.creations,
        paths: filtered.paths,
        props: filtered.props,
        terrainZones: Array.isArray(raw.terrainZones) ? raw.terrainZones : [],
        villagers: Array.isArray(raw.villagers) ? raw.villagers : [],
        contributorCount: Number(raw.contributorCount) || 0,
        contributionCount,
        lastWeaveNote: typeof raw.lastWeaveNote === "string" ? raw.lastWeaveNote : "",
      };
      this.emitFile({
        type: "asset",
        fileName: "world-snapshot.json",
        source: JSON.stringify(snapshot),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), worldSnapshotPlugin()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
    target: "es2022",
    emptyOutDir: true,
  },
});
