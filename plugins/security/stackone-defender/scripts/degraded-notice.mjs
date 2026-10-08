import { closeSync, openSync } from "fs";
import { join } from "path";

/**
 * Whether this session should be told the classifier is unavailable. One marker file per
 * session, created with `wx`, so concurrent sessions and parallel hooks each claim it once.
 * Without a session id there is nothing to key on, so no notice.
 */
export function claimDegradedNotice(dir, sessionId) {
  if (!sessionId) return false;
  const path = join(dir, `defender-degraded-${String(sessionId).replace(/[^\w-]/g, "_")}`);
  try {
    closeSync(openSync(path, "wx"));
    return true;
  } catch (err) {
    // Unrecordable for any reason other than an existing claim: noisy, never silent.
    return err.code !== "EEXIST";
  }
}
