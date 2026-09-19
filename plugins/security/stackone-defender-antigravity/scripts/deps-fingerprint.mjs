/**
 * Fingerprint of everything that decides which package versions end up in node_modules.
 *
 * Imported by both scan-tool-result.mjs and defender-daemon.mjs so the client's expected
 * value and the daemon's recorded value can never drift. They are compared to decide
 * whether a running daemon still matches the tree on disk, so two copies of this logic
 * would mean either a kill/respawn loop on every scan or a permanently stale daemon.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

export function depsFingerprint(pluginRoot) {
  try {
    const pkg = JSON.parse(readFileSync(join(pluginRoot, "package.json"), "utf8"));
    const hash = createHash("sha256").update(
      JSON.stringify({ dependencies: pkg.dependencies ?? {}, overrides: pkg.overrides ?? {} }),
    );
    // npm resolves from the lockfile when one is present, so a lockfile-only change
    // (a transitive bump that needed no override) also changes what lands on disk.
    try {
      hash.update(readFileSync(join(pluginRoot, "package-lock.json")));
    } catch {
      // No lockfile: package.json alone decides resolution.
    }
    return hash.digest("hex");
  } catch {
    return null;
  }
}
