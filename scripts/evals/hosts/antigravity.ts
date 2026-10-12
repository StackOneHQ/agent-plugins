// Antigravity CLI (`agy`). Prints only the final reply, but keeps a
// per-conversation transcript with every tool call under
// ~/.gemini/antigravity-cli/brain/. --add-dir registers the working directory
// as a workspace; without it the agent does not see the skills installed there.

import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { commandVersion, exec, installWithSkillsCli, parseJsonLines } from '../process.ts';
import type { HostAdapter, JsonEvent, RawRun, RunContext, ToolCall, Transcript } from '../types.ts';

export const antigravity: HostAdapter = {
  defaultModel: 'gemini-3.8-flash-high',

  version(): string {
    return commandVersion('agy');
  },

  run({ prompt, workDir, pluginDir, withSkill, model }: RunContext): RawRun {
    if (withSkill) {
      installWithSkillsCli(pluginDir, 'antigravity-cli', workDir);
    }
    const raw = exec(
      'agy',
      ['-p', prompt, '--add-dir', workDir, '--dangerously-skip-permissions', '--print-timeout', '5m', '--model', model],
      { cwd: workDir },
    );
    raw.transcript = readTranscript(workDir);
    return raw;
  },

  parse(raw: RawRun): Transcript {
    const toolCalls: ToolCall[] = [];
    let turns = 0;
    for (const event of parseJsonLines(raw.transcript ?? '')) {
      if (event.type === 'PLANNER_RESPONSE') {
        turns += 1;
      }
      for (const call of (event.tool_calls ?? []) as JsonEvent[]) {
        toolCalls.push({ name: call.name ?? call.tool_name ?? 'tool', input: call.args ?? call.arguments ?? call.input ?? call });
      }
    }
    const error = raw.error ?? (raw.transcript ? undefined : 'antigravity transcript not found');
    return { toolCalls, finalText: raw.stdout, turns, error };
  },
};

// agy maps each working directory to its latest conversation id, and stores
// that conversation's full transcript, one JSON event per line, alongside it.
function readTranscript(workDir: string): string | undefined {
  const antigravityHome = join(homedir(), '.gemini', 'antigravity-cli');
  const mapPath = join(antigravityHome, 'cache', 'last_conversations.json');
  if (!existsSync(mapPath)) {
    return undefined;
  }
  const conversations = JSON.parse(readFileSync(mapPath, 'utf8')) as Record<string, string>;
  const conversationId = conversations[workDir] ?? conversations[realpathSync(workDir)];
  if (!conversationId) {
    return undefined;
  }
  const transcriptPath = join(antigravityHome, 'brain', conversationId, '.system_generated', 'logs', 'transcript_full.jsonl');
  if (!existsSync(transcriptPath)) {
    return undefined;
  }
  return readFileSync(transcriptPath, 'utf8');
}
