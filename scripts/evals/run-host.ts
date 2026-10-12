#!/usr/bin/env node
// Runs a plugin's eval cases against one agent host and grades each run with
// the host-neutral checks in the case file.
//
// Usage:
//   node scripts/evals/run-host.ts --host claude --plugin plugins/integrations/stackone-platform
//   node scripts/evals/run-host.ts --host antigravity --plugin <dir> --model gemini-3.8-flash-high
//   node scripts/evals/run-host.ts --host claude --plugin <dir> --baseline        # same prompts, no skills
//   node scripts/evals/run-host.ts --host claude --plugin <dir> --case debug-401 --json out.json
//   node scripts/evals/run-host.ts --host claude --plugin <dir> --case embed-hub --runs 3 --model opus   # --case matches a name prefix
//   node scripts/evals/run-host.ts --host claude --plugin <dir> --score-reference --judge-model sonnet
//
// Cases live beside the runner in cases/<plugin-name>/, keyed by the plugin
// directory's name, so the plugin ships without its test fixtures; --cases
// overrides the location. Every run gets a throwaway working directory, and
// each host adapter adds whatever else keeps the run isolated to the plugin
// under test. Cases with reference facts get one judge call per run on top of
// the agent run. Runs on Node 22.18 or later with no dependencies (Node strips
// the types itself).
// Typecheck with `npm --prefix scripts/evals install` once, then
// `npm --prefix scripts/evals run typecheck`.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { loadCases } from './cases.ts';
import { grade, skillsUsed } from './grade.ts';
import { adapters, isHostName } from './hosts/index.ts';
import { judgeReference } from './judge.ts';
import { printRun, printSummary, summarise } from './report.ts';
import type { CaseResult, RunResult } from './types.ts';

type CliOptions = Record<string, string | true>;

function main(argv: string[]): number {
  const options = parseArgs(argv);
  const host = typeof options.host === 'string' ? options.host : '';
  const pluginOption = typeof options.plugin === 'string' ? options.plugin : '';
  if (!host || !pluginOption) {
    console.error('usage: run-host.ts --host <claude|antigravity|cursor|codex> --plugin <dir> [--runs N] [--model M] [--case NAME-OR-PREFIX] [--baseline] [--cases DIR] [--judge-model M] [--score-reference] [--json out.json]');
    return 2;
  }
  if (!isHostName(host)) {
    console.error(`unknown host ${host}; known: ${Object.keys(adapters).join(', ')}`);
    return 2;
  }

  const adapter = adapters[host];
  const pluginDir = resolve(pluginOption);
  const casesDir = typeof options.cases === 'string'
    ? resolve(options.cases)
    : join(import.meta.dirname, 'cases', basename(pluginDir));
  const runsPerCase = Number(options.runs ?? 1);
  const withSkill = !options.baseline;
  const model = typeof options.model === 'string' ? options.model : adapter.defaultModel;
  const judgeModel = typeof options['judge-model'] === 'string' ? options['judge-model'] : 'sonnet';
  const scoreReference = Boolean(options['score-reference']);
  const outputRoot = mkdtempSync(join(tmpdir(), `evals-${host}-`));
  const hostVersion = adapter.version();

  console.log(`host:    ${host} (${hostVersion})`);
  console.log(`plugin:  ${pluginDir}${withSkill ? '' : '  [baseline: skills NOT installed]'}`);
  console.log(`cases:   ${casesDir}`);
  console.log(`runs:    ${runsPerCase} per case, model ${model}`);
  console.log(`judge:   ${judgeModel}, reference checks ${scoreReference ? 'scored' : 'reported as indicators'}`);
  console.log(`output:  ${outputRoot}`);
  console.log('');

  const cases = loadCases(casesDir, {
    casePrefix: typeof options.case === 'string' ? options.case : undefined,
  });

  const results: CaseResult[] = [];
  for (const evalCase of cases) {
    const runs: RunResult[] = [];
    for (let runIndex = 0; runIndex < runsPerCase; runIndex += 1) {
      const workDir = mkdtempSync(join(outputRoot, `${evalCase.name}.run${runIndex}.`));
      const transcriptPath = join(outputRoot, `${evalCase.name}.run${runIndex}.jsonl`);
      const raw = adapter.run({ prompt: evalCase.prompt, workDir, pluginDir, withSkill, model, maxTurns: evalCase.maxTurns });
      writeFileSync(transcriptPath, raw.transcript ?? raw.stdout);
      writeFileSync(`${transcriptPath}.err`, raw.stderr);
      const transcript = adapter.parse(raw);
      const checks = grade(evalCase.expectation, transcript);
      let judgeCostUsd: number | undefined;
      if (evalCase.expectation.reference?.length) {
        const judged = judgeReference(evalCase.expectation.reference, transcript.finalText, {
          model: judgeModel,
          workDir,
          scored: scoreReference,
        });
        checks.push(...judged.checks);
        judgeCostUsd = judged.costUsd;
      }
      const scored = checks.filter((check) => check.scored);
      const passedCount = scored.filter((check) => check.passed).length;
      const run: RunResult = {
        passed: scored.every((check) => check.passed),
        score: scored.length ? passedCount / scored.length : 1,
        turns: transcript.turns,
        costUsd: transcript.costUsd,
        judgeCostUsd,
        error: transcript.error ?? null,
        checks,
        toolCalls: transcript.toolCalls.map((call) => call.name),
        skillsUsed: skillsUsed(transcript),
        transcriptPath,
      };
      runs.push(run);
      printRun(evalCase.name, runIndex, run, transcript);
    }
    results.push({
      name: evalCase.name,
      aggregates: {
        score: runs.reduce((sum, run) => sum + run.score, 0) / runs.length,
        passRate: runs.filter((run) => run.passed).length / runs.length,
        runsWithErrors: runs.filter((run) => run.error).length,
      },
      runs,
    });
  }

  const result = summarise(results, {
    host,
    hostVersion,
    model,
    withSkill,
    runsPerCase,
    startedAt: new Date().toISOString(),
  });
  printSummary(result, outputRoot);
  if (typeof options.json === 'string') {
    writeFileSync(options.json, JSON.stringify(result, null, 2));
    console.log(`wrote ${options.json}`);
  }
  return result.aggregates.casesPassed === result.aggregates.casesTotal ? 0 : 1;
}

function parseArgs(argv: string[]): CliOptions {
  const parsed: CliOptions = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      continue;
    }
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next === undefined || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

process.exit(main(process.argv.slice(2)));
