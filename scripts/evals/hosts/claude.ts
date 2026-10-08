// Claude Code. Runs `claude -p` with a throwaway config directory so no
// installed plugin, MCP server or user setting loads, and passes the plugin
// under test with --plugin-dir. stream-json gives one event per line with
// tool calls on assistant events and the reply and cost on the result event.

import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { commandVersion, exec, parseJsonLines } from '../process.ts';
import type { HostAdapter, JsonEvent, RawRun, RunContext, ToolCall, Transcript } from '../types.ts';

export const claude: HostAdapter = {
  defaultModel: 'sonnet',

  version(): string {
    return commandVersion('claude');
  },

  run({ prompt, workDir, pluginDir, withSkill, model, maxTurns }: RunContext): RawRun {
    const configDir = mkdtempSync(join(workDir, 'claude-config-'));
    const args = [
      '-p', prompt,
      '--strict-mcp-config',
      '--output-format', 'stream-json', '--verbose',
      '--allowedTools', 'WebFetch', 'Skill',
      '--max-turns', String(maxTurns),
      '--model', model,
    ];
    if (withSkill) {
      args.push('--plugin-dir', pluginDir);
    }
    return exec('claude', args, { cwd: workDir, env: { ...process.env, CLAUDE_CONFIG_DIR: configDir } });
  },

  parse(raw: RawRun): Transcript {
    const toolCalls: ToolCall[] = [];
    let finalText = '';
    let turns: number | undefined;
    let costUsd: number | undefined;
    let error: string | undefined = raw.error;
    for (const event of parseJsonLines(raw.stdout)) {
      if (event.type === 'assistant') {
        for (const block of (event.message?.content ?? []) as JsonEvent[]) {
          if (block.type === 'tool_use') {
            toolCalls.push({ name: block.name, input: block.input });
          }
        }
      }
      if (event.type === 'result') {
        finalText = event.result ?? '';
        turns = event.num_turns;
        costUsd = event.total_cost_usd;
        if (event.is_error) {
          error = event.terminal_reason ?? 'error';
        }
      }
      // With --plugin-dir exactly one plugin should load besides the ones
      // Claude Code ships built in; anything more means the throwaway config
      // directory did not isolate the run.
      if (event.type === 'system' && event.subtype === 'init') {
        const loaded = ((event.plugins ?? []) as JsonEvent[]).filter((plugin) => plugin.path !== 'builtin');
        if (loaded.length > 1) {
          error = `isolation broken: ${loaded.map((plugin) => plugin.name).join(', ')} loaded`;
        }
      }
    }
    return { toolCalls, finalText, turns, costUsd, error };
  },
};
