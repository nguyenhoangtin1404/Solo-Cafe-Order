#!/usr/bin/env node

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const requiredBins = [
  join(root, "node_modules", ".bin", "eslint"),
  join(root, "node_modules", ".bin", "tsc"),
];

const hasDepsInstalled = requiredBins.every((binPath) => existsSync(binPath));

if (hasDepsInstalled) {
  process.exit(0);
}

console.log("[ensure:deps] Missing local dependencies. Running npm install...");

const result = spawnSync("npm", ["install", "--no-audit", "--no-fund"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("[ensure:deps] Dependencies are ready.");
