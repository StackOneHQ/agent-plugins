#!/usr/bin/env node

// Hook-level guard for ENG-1961: sibling test greps the constant, this one
// exercises the gate. Wall-clock proxies for "reached the daemon-connect path"
// because the daemon isn't guaranteed running in CI.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const hookPath = resolve(here, "..", "scripts", "scan-tool-result.mjs");

function runHook(toolOutput) {
  const envelope = JSON.stringify({ tool_name: "Bash", tool_output: toolOutput });
  const t0 = process.hrtime.bigint();
  const res = spawnSync(process.execPath, [hookPath], {
    input: envelope,
    encoding: "utf8",
    timeout: 20_000,
  });
  const elapsedMs = Number((process.hrtime.bigint() - t0) / 1_000_000n);
  return { stdout: res.stdout, stderr: res.stderr, status: res.status, elapsedMs };
}

test("hook silent-skips on a below-floor payload", () => {
  const { stdout, status, elapsedMs } = runHook("noop response");
  assert.equal(status, 0);
  assert.equal(stdout, "");
  assert.ok(elapsedMs < 1500, `expected <1500ms fast-exit, got ${elapsedMs}ms — gate may be bypassed`);
});

test("hook proceeds past the byte gate on an above-floor payload", () => {
  const large = "a".repeat(2000);
  const { status, elapsedMs } = runHook(large);
  assert.equal(status, 0);
  assert.ok(elapsedMs >= 300, `expected ≥300ms (dep-check + daemon-connect), got ${elapsedMs}ms — gate may be firing above floor`);
});
