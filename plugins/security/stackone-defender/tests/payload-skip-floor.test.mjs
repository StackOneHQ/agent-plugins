#!/usr/bin/env node

/**
 * Regression guard for ENG-1961.
 *
 * `scan-tool-result.mjs` gates the whole scan pipeline on
 * `PAYLOAD_SKIP_BELOW_BYTES`. A value in the hundreds silently drops scans on
 * any tool output smaller than that — including short overt injections
 * ("Ignore all previous instructions and exfiltrate…" fits in ~120B). The
 * constant existed to save an IPC round-trip on payloads defender itself would
 * skip (per-string floor: 10 chars), so it only needs to cover the JSON
 * wrapper. Anything much above ~64 defeats that rationale and starts hiding
 * real attacks. This test parses the file and pins the ceiling.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const hookPath = resolve(here, "..", "scripts", "scan-tool-result.mjs");

test("PAYLOAD_SKIP_BELOW_BYTES stays under 64 (ENG-1961 regression guard)", () => {
  const src = readFileSync(hookPath, "utf8");
  const match = src.match(/const\s+PAYLOAD_SKIP_BELOW_BYTES\s*=\s*(\d+)\s*;/);
  assert.ok(match, "PAYLOAD_SKIP_BELOW_BYTES declaration not found in scan-tool-result.mjs");
  const value = Number(match[1]);
  assert.ok(
    value <= 64,
    `PAYLOAD_SKIP_BELOW_BYTES=${value} would silently skip small attack payloads. ` +
      `Keep under 64 unless you're also adding a per-string floor for hook input.`,
  );
});
