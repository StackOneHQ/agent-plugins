import { readFileSync, writeFileSync } from "fs";

/**
 * Whether this session should be told the classifier is unavailable. Records the session
 * id, so the notice shows once per session rather than on every tool call.
 */
export function claimDegradedNotice(path, sessionId) {
  const key = sessionId ?? "unknown";
  try {
    if (readFileSync(path, "utf8") === key) return false;
  } catch {
    // No record yet.
  }
  try {
    writeFileSync(path, key);
  } catch {
    // Unrecorded, so the next scan notifies again: noisy, never silent.
  }
  return true;
}
