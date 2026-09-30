// Loads eval cases from a directory. A case is one JSON file, <name>.json,
// holding the prompt, an optional turn cap and the checks.

import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { EvalCase, Expectation } from './types.ts';

export interface CaseFilters {
  /** Only cases whose file name starts with this run; a full name selects one case. */
  casePrefix?: string;
}

/** The on-disk shape: the prompt and turn cap sit next to the expectation's checks. */
interface CaseFile extends Expectation {
  prompt: string;
  max_turns?: number;
}

const DEFAULT_MAX_TURNS = 12;

export function loadCases(evalsDir: string, filters: CaseFilters = {}): EvalCase[] {
  const cases: EvalCase[] = [];
  for (const fileName of readdirSync(evalsDir).sort()) {
    if (!fileName.endsWith('.json')) {
      continue;
    }
    const name = basename(fileName, '.json');
    if (filters.casePrefix && !name.startsWith(filters.casePrefix)) {
      continue;
    }
    const path = join(evalsDir, fileName);
    const { prompt, max_turns, ...expectation } = JSON.parse(readFileSync(path, 'utf8')) as CaseFile;
    if (typeof prompt !== 'string' || !prompt.trim()) {
      throw new Error(`${path}: "prompt" must be a non-empty string`);
    }
    cases.push({
      name,
      path,
      prompt: prompt.trim(),
      maxTurns: max_turns ?? DEFAULT_MAX_TURNS,
      expectation,
    });
  }
  return cases;
}
