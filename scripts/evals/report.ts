// Console output and the machine-readable result for a suite run.

import type { CaseResult, HostName, RunResult, SuiteResult, Transcript } from './types.ts';

export function printRun(caseName: string, runIndex: number, run: RunResult, transcript: Transcript): void {
  const label = run.passed ? 'PASS' : 'FAIL';
  const errorLabel = run.error ? `  error=${run.error}` : '';
  console.log(`${label}  ${caseName.padEnd(24)} run ${runIndex}  score=${run.score.toFixed(2)} turns=${run.turns ?? '?'}${errorLabel}`);
  for (const check of run.checks) {
    if (!check.passed) {
      const detail = check.detail ? `: ${check.detail}` : '';
      console.log(`        - ${check.name}${check.scored ? '' : ' (indicator)'}${detail}`);
    }
  }
  const fetchedUrls = transcript.toolCalls
    .map((call) => JSON.stringify(call.input ?? ''))
    .flatMap((input) => input.match(/https?:\/\/[^"\\\s]+/g) ?? []);
  if (fetchedUrls.length) {
    console.log(`        urls: ${[...new Set(fetchedUrls)].join(' ')}`);
  }
  if (run.skillsUsed.length) {
    console.log(`        skills: ${run.skillsUsed.join(' ')}`);
  }
}

export interface SuiteContext {
  host: HostName;
  hostVersion: string;
  model: string;
  withSkill: boolean;
  runsPerCase: number;
  startedAt: string;
}

export function summarise(cases: CaseResult[], context: SuiteContext): SuiteResult {
  const allRuns = cases.flatMap((entry) => entry.runs);
  const casesPassed = cases.filter((entry) => entry.aggregates.passRate === 1).length;
  const overallScore = cases.reduce((sum, entry) => sum + entry.aggregates.score, 0) / (cases.length || 1);
  const runsWithErrors = allRuns.filter((run) => run.error).length;
  // Only some hosts report spend; a zero from a host that does not would mislead.
  // Judge calls always report theirs, and count toward the total.
  const costKnown = allRuns.some((run) => run.costUsd !== undefined || run.judgeCostUsd !== undefined);
  const costUsd = allRuns.reduce((sum, run) => sum + (run.costUsd ?? 0) + (run.judgeCostUsd ?? 0), 0);
  return {
    ...context,
    cases,
    aggregates: {
      casesTotal: cases.length,
      casesPassed,
      overallScore,
      overallPassRate: casesPassed / (cases.length || 1),
      runsWithErrors,
    },
    costUsd: costKnown ? costUsd : null,
  };
}

export function printSummary(result: SuiteResult, outputRoot: string): void {
  const { casesPassed, casesTotal, overallScore, runsWithErrors } = result.aggregates;
  const costLabel = result.costUsd === null ? 'n/a' : `$${result.costUsd.toFixed(2)}`;
  const errorLabel = runsWithErrors ? `   runs with errors ${runsWithErrors} (verdicts on those are ambiguous)` : '';
  console.log('');
  console.log(`cases passed ${casesPassed} / ${casesTotal}   overall score ${overallScore.toFixed(2)}   cost ${costLabel}${errorLabel}   transcripts in ${outputRoot}`);
}
