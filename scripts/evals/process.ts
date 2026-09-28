// Process helpers shared by every host adapter: running a CLI, reading its
// version, parsing JSONL output, and installing a plugin's skills the way a
// user of that host would.

import { spawnSync } from 'node:child_process';
import type { JsonEvent, RawRun } from './types.ts';

export interface ExecOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

/** Runs a command to completion with a generous buffer and a ten minute cap. */
export function exec(command: string, args: string[], options: ExecOptions = {}): RawRun {
  const spawned = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 600_000,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
  let error: string | undefined;
  if (spawned.error) {
    const code = (spawned.error as NodeJS.ErrnoException).code;
    error = code === 'ETIMEDOUT' ? 'timed out' : spawned.error.message;
  }
  return { stdout: spawned.stdout ?? '', stderr: spawned.stderr ?? '', error };
}

export function commandVersion(command: string): string {
  const spawned = spawnSync(command, ['--version'], { encoding: 'utf8' });
  return firstLine(spawned.stdout);
}

export function firstLine(text: string | null | undefined): string {
  return (text ?? '').split('\n')[0].trim() || 'unknown';
}

/** Parses one JSON object per line, skipping anything that is not one. */
export function parseJsonLines(text: string): JsonEvent[] {
  const events: JsonEvent[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) {
      continue;
    }
    try {
      events.push(JSON.parse(trimmed) as JsonEvent);
    } catch {
      // partial or non-JSON line; skip
    }
  }
  return events;
}

// Installs the plugin's skills into the working directory the way a user of
// that host would, so the host discovers them from the project.
export function installWithSkillsCli(pluginDir: string, agent: string, workDir: string): void {
  spawnSync('git', ['init', '-q', '.'], { cwd: workDir });
  const install = spawnSync('npx', ['-y', 'skills', 'add', pluginDir, '-a', agent, '-s', '*', '-y', '--copy'], {
    cwd: workDir,
    encoding: 'utf8',
    timeout: 120_000,
  });
  if (install.status !== 0) {
    throw new Error(`skills add failed for ${agent}: ${install.stderr || install.stdout}`);
  }
}
