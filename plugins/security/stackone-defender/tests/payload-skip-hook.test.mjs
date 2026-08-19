#!/usr/bin/env node

// Hook-level smoke tests for ENG-1961. The sibling payload-skip-floor.test.mjs
// pins the constant value; this file spawns the hook and checks it doesn't
// crash or false-positive on the two ends of the byte-gate. No wall-clock
// assertions — a warm/cold daemon flips those unpredictably.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const hookPath = resolve(here, "..", "scripts", "scan-tool-result.mjs");

function runHook(toolOutput) {
  const envelope = JSON.stringify({ tool_name: "Bash", tool_output: toolOutput });
  return spawnSync(process.execPath, [hookPath], {
    input: envelope,
    encoding: "utf8",
    timeout: 20_000,
  });
}

test("hook silent-skips on a below-floor payload", () => {
  const { stdout, status } = runHook("noop response");
  assert.equal(status, 0);
  assert.equal(stdout, "");
});

test("hook does not false-positive on above-floor benign text", () => {
  const benign = "The quick brown fox jumps over the lazy dog. ".repeat(50);
  const { stdout, status } = runHook(benign);
  assert.equal(status, 0);
  assert.equal(stdout, "", "benign payload must not trigger a cue");
});
