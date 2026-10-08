// OpenAI Codex CLI. Runs `codex exec --json` after installing the plugin's
// skills into the working directory with the Skills CLI. The event schema has
// not been confirmed against a live run yet, so parsing is liberal.

import { commandVersion, exec, installWithSkillsCli } from '../process.ts';
import type { HostAdapter, RawRun, RunContext, Transcript } from '../types.ts';
import { parseLiberally } from './liberal-transcript.ts';

export const codex: HostAdapter = {
  defaultModel: 'gpt-5',

  version(): string {
    return commandVersion('codex');
  },

  run({ prompt, workDir, pluginDir, withSkill, model }: RunContext): RawRun {
    if (withSkill) {
      installWithSkillsCli(pluginDir, 'codex', workDir);
    }
    return exec('codex', ['exec', '--json', '--model', model, prompt], { cwd: workDir });
  },

  parse(raw: RawRun): Transcript {
    return parseLiberally(raw);
  },
};
