// Grades a normalised transcript against a case's checks. Every check is
// a regex over either the JSON-encoded tool inputs or the final reply, so the
// same expectation grades every host. "Fetched" means any tool call whose
// input matches, whatever the host names its fetch tool.

import type { Check, Expectation, ToolCall, Transcript } from './types.ts';

export function grade(expectation: Expectation, transcript: Transcript): Check[] {
  const checks: Check[] = [];
  const inputs = transcript.toolCalls.map((call) => JSON.stringify(call.input ?? ''));
  const anyInputMatches = (pattern: string): boolean => inputs.some((input) => new RegExp(pattern).test(input));
  const replyMatches = (pattern: string): boolean => new RegExp(pattern).test(transcript.finalText);

  for (const check of expectation.fetch ?? []) {
    checks.push({ name: check.name, passed: anyInputMatches(check.match), scored: true });
  }
  for (const check of expectation.no_fetch ?? []) {
    checks.push({ name: check.name, passed: !anyInputMatches(check.match), scored: true });
  }
  for (const check of expectation.reply ?? []) {
    checks.push({ name: check.name, passed: replyMatches(check.match), scored: true });
  }
  for (const check of expectation.no_reply ?? []) {
    checks.push({ name: check.name, passed: !replyMatches(check.match), scored: true });
  }

  // Which skill fired is reported, never scored. Hosts reach a skill
  // differently, a baseline run has no skill to fire, and the verdict belongs
  // to the outcome checks above: a right answer reached through the "wrong"
  // skill is still a right answer.
  if (expectation.skill_should_fire !== undefined) {
    const skillUsed = transcript.toolCalls.some((call) => usesSkill(call, expectation.skill));
    checks.push({
      name: expectation.skill_should_fire ? 'skill-fired' : 'skill-not-invoked',
      passed: skillUsed === expectation.skill_should_fire,
      scored: false,
    });
  }
  return checks;
}

// A skill is reached either by an explicit skill-invocation tool or by the
// agent reading its SKILL.md, which is how hosts without a Skill tool load it.
export function usesSkill(call: ToolCall, skillName: string): boolean {
  const input = JSON.stringify(call.input ?? '');
  if (/^skill$/i.test(call.name) && input.includes(skillName)) {
    return true;
  }
  return new RegExp(`skills/${skillName}/SKILL\\.md`).test(input);
}

/** Every skill the run reached, by either route, for the per-run diagnostic line. */
export function skillsUsed(transcript: Transcript): string[] {
  const names = new Set<string>();
  for (const call of transcript.toolCalls) {
    const input = JSON.stringify(call.input ?? '');
    if (/^skill$/i.test(call.name)) {
      const named = input.match(/"skill":"(?:[^":]*:)?([^"]+)"/);
      if (named) {
        names.add(named[1]);
      }
    }
    for (const read of input.matchAll(/skills\/([^/"\\]+)\/SKILL\.md/g)) {
      names.add(read[1]);
    }
  }
  return [...names];
}
