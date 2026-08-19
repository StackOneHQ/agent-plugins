#!/usr/bin/env node

// Below-floor smoke: hook must silent-exit cleanly on a payload smaller than
// PAYLOAD_SKIP_BELOW_BYTES. Above-floor FP behavior is covered by the QA
// fixture suite (in-process, deterministic) — asserting it here would pass
// vacuously on any fail-open path (dep-install fail, daemon-down, timeout).

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const hookPath = resolve(here, "..", "scripts", "scan-tool-result.mjs");

test("hook silent-skips on a below-floor payload", () => {
  const envelope = JSON.stringify({ tool_name: "Bash", tool_output: "noop response" });
  const { stdout, status } = spawnSync(process.execPath, [hookPath], {
    input: envelope,
    encoding: "utf8",
    timeout: 20_000,
  });
  assert.equal(status, 0);
  assert.equal(stdout, "");
});
