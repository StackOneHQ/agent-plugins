import { closeSync, openSync, readdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";

/**
 * Whether this session should be told the classifier is unavailable. One marker file per
 * session, created with `wx`, so concurrent sessions and parallel hooks each claim it once.
 * Without a session id there is nothing to key on, so no notice.
 */
const PREFIX = "defender-degraded-";
const MARKER_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function claimDegradedNotice(dir, sessionId) {
  if (!sessionId) return false;
  const path = join(dir, `${PREFIX}${String(sessionId).replace(/[^\w-]/g, "_")}`);
  try {
    closeSync(openSync(path, "wx"));
    pruneOldMarkers(dir);
    return true;
  } catch (err) {
    // Unrecordable for any reason other than an existing claim: noisy, never silent.
    return err.code !== "EEXIST";
  }
}

// A machine that stays degraded gains a marker per conversation; drop week-old ones.
function pruneOldMarkers(dir) {
  try {
    const cutoff = Date.now() - MARKER_TTL_MS;
    for (const name of readdirSync(dir)) {
      if (!name.startsWith(PREFIX)) continue;
      const file = join(dir, name);
      if (statSync(file).mtimeMs < cutoff) unlinkSync(file);
    }
  } catch {
    // Pruning is housekeeping; a failure only leaves old empty files behind.
  }
}
