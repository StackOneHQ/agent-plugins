// Judges a reply against a case's reference facts with one model call, so a
// case can grade what the answer says and not only which strings it holds.
// The judge asks for coverage and contradiction per fact, never similarity:
// a different but compatible approach must pass.
//
// The judge always runs through Claude Code in print mode with the same
// throwaway config directory the Claude adapter uses, whichever host the case
// ran on, so a verdict does not depend on the host's model.

import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { exec } from './process.ts';
import type { Check } from './types.ts';

export interface JudgeOptions {
  model: string;
  /** Directory the judge's throwaway config directory is created in. */
  workDir: string;
  /** Whether the reference checks count toward the run's score. */
  scored: boolean;
}

export interface JudgeResult {
  checks: Check[];
  costUsd?: number;
}

type FactStatus = 'covered' | 'missing' | 'contradicted';

interface FactVerdict {
  index: number;
  status: FactStatus;
  evidence?: string;
}

interface JudgeVerdict {
  facts: FactVerdict[];
  contradictions?: string[];
}

export function judgeReference(reference: string[], reply: string, options: JudgeOptions): JudgeResult {
  const configDir = mkdtempSync(join(options.workDir, 'judge-config-'));
  const raw = exec(
    'claude',
    ['-p', buildPrompt(reference, reply), '--strict-mcp-config', '--output-format', 'json', '--max-turns', '1', '--model', options.model],
    { cwd: options.workDir, env: { ...process.env, CLAUDE_CONFIG_DIR: configDir } },
  );
  if (raw.error) {
    return { checks: [judgeFailed(`judge did not run: ${raw.error}`)] };
  }

  let resultText = '';
  let costUsd: number | undefined;
  try {
    const output = JSON.parse(raw.stdout) as { result?: string; total_cost_usd?: number; is_error?: boolean };
    resultText = output.result ?? '';
    costUsd = output.total_cost_usd;
    if (output.is_error) {
      return { checks: [judgeFailed(`judge run errored: ${resultText.slice(0, 200)}`)], costUsd };
    }
  } catch {
    return { checks: [judgeFailed(`judge output was not JSON: ${raw.stdout.slice(0, 200)}`)] };
  }

  const verdict = parseVerdict(resultText);
  if (!verdict) {
    return { checks: [judgeFailed(`judge verdict was not parsable: ${resultText.slice(0, 200)}`)], costUsd };
  }

  const checks: Check[] = reference.map((fact, position) => {
    const index = position + 1;
    const factVerdict = verdict.facts.find((entry) => entry.index === index);
    if (!factVerdict) {
      return { name: `reference-${index}`, passed: false, scored: options.scored, detail: 'no verdict from judge' };
    }
    const evidence = factVerdict.evidence ? `: ${factVerdict.evidence}` : '';
    return {
      name: `reference-${index}`,
      passed: factVerdict.status === 'covered',
      scored: options.scored,
      detail: `${factVerdict.status}${evidence}`,
    };
  });
  const contradictions = verdict.contradictions ?? [];
  checks.push({
    name: 'reference-no-contradictions',
    passed: contradictions.length === 0,
    scored: options.scored,
    detail: contradictions.length ? contradictions.join('; ') : undefined,
  });
  return { checks, costUsd };
}

function judgeFailed(detail: string): Check {
  return { name: 'reference-judge', passed: false, scored: false, detail };
}

function buildPrompt(reference: string[], reply: string): string {
  const facts = reference.map((fact, position) => `${position + 1}. ${fact}`).join('\n');
  return [
    "You are grading an AI assistant's reply against reference facts. Do not use any tools.",
    '',
    'For each numbered fact, decide whether the reply:',
    '- "covered": states the fact, in any wording or as code',
    '- "missing": does not address the fact',
    '- "contradicted": states something incompatible with the fact',
    '',
    'Then list any other claim in the reply that contradicts the reference facts as a whole.',
    'Judge substance only. Different wording, extra detail, or a different but compatible approach is not a contradiction.',
    '',
    'Answer with JSON only, no prose before or after, in exactly this shape:',
    '{"facts":[{"index":1,"status":"covered","evidence":"short quote or reason"}],"contradictions":[]}',
    '',
    'Reference facts:',
    facts,
    '',
    'Reply:',
    '<<<REPLY',
    reply,
    'REPLY>>>',
  ].join('\n');
}

/** Accepts the JSON object anywhere in the text, so a stray sentence or code fence around it does not lose the verdict. */
function parseVerdict(text: string): JudgeVerdict | undefined {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<JudgeVerdict>;
    if (!Array.isArray(parsed.facts)) {
      return undefined;
    }
    return { facts: parsed.facts, contradictions: parsed.contradictions ?? [] };
  } catch {
    return undefined;
  }
}
