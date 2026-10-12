// Cursor agent CLI. Runs `cursor-agent -p` with stream-json output after
// installing the plugin's skills into the working directory with the Skills
// CLI. The event schema has not been confirmed against a live run yet, so
// parsing is liberal.

import { commandVersion, exec, installWithSkillsCli } from '../process.ts';
import type { HostAdapter, RawRun, RunContext, Transcript } from '../types.ts';
import { parseLiberally } from './liberal-transcript.ts';

export const cursor: HostAdapter = {
  defaultModel: 'sonnet-4',

  version(): string {
    return commandVersion('cursor-agent');
  },

  run({ prompt, workDir, pluginDir, withSkill, model }: RunContext): RawRun {
    if (withSkill) {
      installWithSkillsCli(pluginDir, 'cursor', workDir);
    }
    return exec('cursor-agent', ['-p', '--output-format', 'stream-json', '--model', model, '-f', prompt], { cwd: workDir });
  },

  parse(raw: RawRun): Transcript {
    return parseLiberally(raw);
  },
};
