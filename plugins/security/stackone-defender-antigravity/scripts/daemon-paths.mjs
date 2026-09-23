/**
 * Where this plugin's daemon lives. The hook client and the daemon both import these, so
 * they can never disagree about the socket or state file they share.
 *
 * The name is per plugin. stackone-defender and stackone-defender-antigravity pin different
 * dependency trees, and each client replaces any daemon that does not match its own. With
 * one shared identity, installing both made them kill each other's daemon on every scan.
 */
import { homedir } from "os";
import { join } from "path";

const DIR = join(homedir(), ".claude");
const NAME = "defender-antigravity";

export const SOCKET_PATH = join(DIR, `${NAME}.sock`);
export const LOCK_PATH = join(DIR, `${NAME}-daemon.lock`);
export const STATE_PATH = join(DIR, `${NAME}-daemon.json`);
export const DAEMON_LOG = join(DIR, `${NAME}-daemon.log`);
// Separate from the daemon log so client appends don't race the daemon's rotation.
export const CLIENT_LOG = join(DIR, `${NAME}-client.log`);
