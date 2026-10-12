// Shared contracts for the eval runner. A host adapter turns a prompt into a
// RawRun and a RawRun into a Transcript; grading only ever sees the
// Transcript, which is what keeps every check host-neutral.

export type HostName = 'claude' | 'antigravity' | 'cursor' | 'codex';

export interface RegexCheck {
  name: string;
  /** JavaScript regex source, applied to JSON-encoded tool input or to the reply text. */
  match: string;
  note?: string;
}

/** The host-neutral checks in a case file, everything except the prompt and turn cap. */
export interface Expectation {
  skill: string;
  /** Whether the skill is expected to be used. Reported as an indicator, never scored. */
  skill_should_fire?: boolean;
  skill_note?: string;
  fetch?: RegexCheck[];
  no_fetch?: RegexCheck[];
  reply?: RegexCheck[];
  no_reply?: RegexCheck[];
  /** Facts a correct reply states, one per entry, judged by a model call for coverage and contradiction. */
  reference?: string[];
}

export interface EvalCase {
  name: string;
  path: string;
  prompt: string;
  maxTurns: number;
  expectation: Expectation;
}

export interface ToolCall {
  name: string;
  input: unknown;
}

export interface Transcript {
  toolCalls: ToolCall[];
  finalText: string;
  turns?: number;
  costUsd?: number;
  error?: string;
}

export interface RawRun {
  stdout: string;
  stderr: string;
  error?: string;
  /** Hosts that keep the transcript somewhere other than stdout attach it here. */
  transcript?: string;
}

export interface RunContext {
  prompt: string;
  workDir: string;
  pluginDir: string;
  withSkill: boolean;
  model: string;
  maxTurns: number;
}

export interface HostAdapter {
  defaultModel: string;
  version(): string;
  run(context: RunContext): RawRun;
  parse(raw: RawRun): Transcript;
}

export interface Check {
  name: string;
  passed: boolean;
  /** Unscored checks are reported as indicators and do not affect the run's score. */
  scored: boolean;
  /** Why the check has the verdict it has, when the grader can say. */
  detail?: string;
}

export interface RunResult {
  passed: boolean;
  score: number;
  turns?: number;
  costUsd?: number;
  /** Spend of the reference judge call, when a case has reference facts. */
  judgeCostUsd?: number;
  error: string | null;
  checks: Check[];
  toolCalls: string[];
  skillsUsed: string[];
  transcriptPath: string;
}

export interface CaseAggregates {
  score: number;
  passRate: number;
  runsWithErrors: number;
}

export interface CaseResult {
  name: string;
  aggregates: CaseAggregates;
  runs: RunResult[];
}

export interface SuiteAggregates {
  casesTotal: number;
  casesPassed: number;
  overallScore: number;
  overallPassRate: number;
  runsWithErrors: number;
}

export interface SuiteResult {
  host: HostName;
  hostVersion: string;
  model: string;
  withSkill: boolean;
  startedAt: string;
  runsPerCase: number;
  cases: CaseResult[];
  aggregates: SuiteAggregates;
  /** Null when the host does not report spend. */
  costUsd: number | null;
}

/** One parsed line of a JSONL transcript. Shapes differ per host, so fields are read defensively. */
export type JsonEvent = Record<string, any>;
