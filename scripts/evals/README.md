# Eval runner

Runs a plugin's eval cases against one agent host, headless, in a throwaway project, and grades every run with the same host-neutral checks. Cases live here too, under `cases/<plugin-name>/`, one JSON file per case, and `cases/README.md` covers how to write and maintain them. The plugins ship without them. The rest of this directory is the machinery: how a case becomes a run, how a run becomes a verdict, and how to add a host.

## Requirements

| Need | Why |
|---|---|
| Node 22.18 or later | The runner is TypeScript that Node executes directly by stripping types. There is no build step and no runtime dependency. |
| The host's CLI, installed and signed in | See the hosts table below for what each one needs. |
| `npm --prefix scripts/evals install` (optional) | Installs `typescript` and `@types/node` for `npm --prefix scripts/evals run typecheck`. Nothing at run time uses them. |

Type stripping only accepts erasable syntax, so the code uses `interface`, `type` and `import type`, and never enums, namespaces or parameter properties. Imports between modules carry the `.ts` extension because Node resolves them as files.

## Running

From the repo root:

```bash
node scripts/evals/run-host.ts --host claude --plugin plugins/integrations/stackone-platform
```

| Flag | Meaning | Default |
|---|---|---|
| `--host` | `claude`, `antigravity`, `cursor` or `codex` | required |
| `--plugin` | Path to the plugin directory to load into the host. Its cases are read from `scripts/evals/cases/<plugin directory name>/`. | required |
| `--cases` | Read cases from this directory instead | derived from `--plugin` |
| `--runs` | Runs per case. Use 3 or more when a case looks flaky. | 1 |
| `--model` | Model name in the host's own vocabulary | the adapter's default |
| `--case` | Run the cases whose file name starts with this. A full name runs one case; a shared prefix runs a group. | all cases |
| `--baseline` | Run the same prompts with no skill installed, to measure the skill's contribution | off |
| `--judge-model` | Model for the reference judge, in Claude Code's vocabulary | `sonnet` |
| `--score-reference` | Count the reference checks toward the run's score instead of reporting them as indicators | off |
| `--json` | Write the machine-readable result to this path | not written |

Every run prints one line, `PASS` or `FAIL`, with the score, turn count, any failed checks, every URL the agent touched and every skill it reached. The suite ends with cases passed, overall score, cost when the host reports it, and the number of runs that ended in an error. Exit status is 1 when any case has a failing run, so the command works as a CI gate.

The output directory printed at the start holds each run's transcript as `<case>.run<N>.jsonl` and its stderr as `<case>.run<N>.jsonl.err`. It lives under the operating system's temp directory, which gets cleaned, so pass `--json` and copy the transcripts out if you want to look at them later.

## What a run does

1. `cases.ts` reads every `cases/<plugin-name>/<case>.json`. The file holds the `prompt`, sent as the user's message unchanged, an optional `max_turns`, and the checks.
2. For each case and run, `run-host.ts` makes a fresh working directory under the output directory and calls the adapter's `run`. The adapter launches the host there and returns the raw output.
3. The raw transcript is written to disk, then the adapter's `parse` reduces it to a `Transcript`: the tool calls made, each with its input, plus the final reply, the turn count, the cost and any error.
4. `grade.ts` turns the case's expectation and the transcript into a list of checks. The run's score is the share of scored checks that passed, and the run passes when all of them did. A run with no scored checks scores 1.
5. `report.ts` aggregates per case (mean score, pass rate, runs with errors) and across the suite, prints the summary and produces the `--json` document.

Grading never sees host output directly, only the `Transcript`. That is what lets one case file grade Claude Code, Antigravity, Cursor and Codex alike.

## Grading rules

| Check | Passes when | Scored |
|---|---|---|
| `fetch[]` entry | Some tool call's input matches the regex | yes |
| `no_fetch[]` entry | No tool call's input matches | yes |
| `reply[]` entry | The final reply matches | yes |
| `no_reply[]` entry | The final reply does not match | yes |
| `skill-fired` (when `skill_should_fire` is `true`) | The skill under test was used | no, reported as an indicator |
| `skill-not-invoked` (when `skill_should_fire` is `false`) | The skill under test was not used | no, reported as an indicator |
| `reference-N` (one per `reference[]` fact) | The judge found the reply states fact N, in any wording or as code | only with `--score-reference` |
| `reference-no-contradictions` | The judge found nothing in the reply that contradicts the reference facts | only with `--score-reference` |
| `reference-judge` | Appears only when the judge call failed or its verdict could not be parsed; always failing, never scored | no |

The details that make these host-neutral:

- A regex in `match` is applied to the JSON encoding of each tool call's input, or to the reply text. Tool names are ignored, so "fetched" means any tool whose input carries the URL, whether the host calls it `WebFetch`, `read_url_content` or something else.
- A skill counts as used when a tool named `Skill` was called with the skill's name in its input, or when any tool input references `skills/<name>/SKILL.md`. The first is how Claude Code loads a skill; the second is how hosts without a skill tool read it from disk.
- Which skill fired is never scored. The verdict belongs to the outcome checks: a right answer reached through a different skill than expected is still a right answer, and a baseline run has no skill to fire, so scoring it would zero every baseline by construction. The per-run `skills:` line lists every skill the run reached, which is how an over-triggering description shows up without deciding a verdict.
- An error on the run (a timeout, a turn cap, a broken isolation check) does not fail it by itself. The checks still run on whatever transcript exists, the error is printed on the run's line, and the summary counts it under runs with errors, because a verdict on a truncated transcript is ambiguous.

## Reference facts

The string checks prove the reply was built from the right page with the current names. They cannot tell whether the answer is right. A case that needs that adds `reference[]` to its file: the facts a correct answer states, one per entry, written from the docs page at authoring time and kept to the essentials so they are quick to fix when the page changes.

```json
"reference": [
  "The backend creates a connect session by calling POST /connect_sessions with the API key, sending origin_owner_id.",
  "The frontend installs @stackone/hub and renders the StackOneHub component with the returned token.",
  "The API key stays on the backend and is never sent to the browser."
]
```

After the run, `judge.ts` makes one model call with the reply and the list and asks, per fact, whether the reply covers it, omits it or contradicts it, and whether anything in the reply contradicts the facts as a whole. Each fact becomes a `reference-N` check with the judge's evidence in its `detail`, printed on failure. The judge is told that different wording, extra detail or a different but compatible approach is not a contradiction, so it grades substance rather than similarity.

Two properties to know:

- The judge always runs through Claude Code in print mode, with the same throwaway config directory the Claude adapter uses, whichever host the case ran on. A verdict therefore never depends on the host's model, and nothing beyond Claude Code has to be installed. Pin `--judge-model` when comparing runs.
- Reference checks are indicators until `--score-reference` is passed. Read a few runs' `detail` lines first: a fact the judge keeps reporting missing on correct replies is usually a fact that is not essential, and belongs out of the list rather than in a looser prompt.

A judge call costs a few cents and its spend is counted in the suite total. A case without `reference[]` makes no judge call.

## Modules

| File | Responsibility |
|---|---|
| `run-host.ts` | Entry point. Parses flags, loops over cases and runs, writes transcripts, drives grading and reporting. |
| `types.ts` | The contracts everything else shares: `Expectation`, `EvalCase`, `Transcript`, `RawRun`, `RunContext`, `HostAdapter`, `Check` and the result shapes. |
| `cases.ts` | Loads the case files, separates the prompt and turn cap from the checks, applies the `--case` prefix filter. |
| `grade.ts` | The rules in the table above, plus `usesSkill` and `skillsUsed`. |
| `judge.ts` | The reference judge: builds the prompt, runs the model call, parses the verdict into checks. |
| `report.ts` | Per-run and suite console output, and `summarise`, which builds the `SuiteResult`. |
| `process.ts` | Runs a CLI with a large buffer and a ten minute cap, reads a CLI's version, parses JSON lines, and installs a plugin's skills with the Skills CLI. |
| `hosts/index.ts` | The adapter registry and the `HostName` guard. |
| `hosts/<host>.ts` | One adapter per host. |
| `hosts/liberal-transcript.ts` | A schema-agnostic parser for hosts whose JSON event format has not been pinned down against a live run. |

## Host adapters

An adapter is an object with four members:

| Member | Contract |
|---|---|
| `defaultModel` | Used when `--model` is not given. Pin `--model` when comparing runs so a score change is attributable to the skill and not to a model swap. |
| `version()` | The host CLI's version string, printed in the header and stored in the JSON. |
| `run(context)` | Launches the host headless in `context.workDir` with `context.prompt`, honouring `context.model` and `context.maxTurns`, and installs the plugin from `context.pluginDir` only when `context.withSkill` is true. Returns a `RawRun`: `stdout`, `stderr`, an optional `error`, and an optional `transcript` for hosts that keep the transcript somewhere other than stdout. |
| `parse(raw)` | Reduces the `RawRun` to a `Transcript`. Must be total: return whatever could be recovered and carry `raw.error` through. |

How each host is driven:

| Host | Launch | Skill installation | Transcript source | Needs |
|---|---|---|---|---|
| `claude` | `claude -p` with `--output-format stream-json`, `--strict-mcp-config`, `--allowedTools WebFetch Skill`, and a throwaway `CLAUDE_CONFIG_DIR` so no installed plugin, MCP server or user setting loads | `--plugin-dir <plugin>` | stdout: `tool_use` blocks on assistant events, reply, turns and cost on the result event | Claude Code signed in |
| `antigravity` | `agy -p` with `--add-dir <workDir>`, `--dangerously-skip-permissions` and a print timeout | `npx skills add <plugin> -a antigravity-cli` into `.agents/skills/` | The conversation transcript under `~/.gemini/antigravity-cli/brain/`, found through `cache/last_conversations.json` keyed by working directory; stdout is only the reply | `agy` signed in |
| `cursor` | `cursor-agent -p --output-format stream-json` | `npx skills add <plugin> -a cursor` | stdout, parsed liberally until the event schema is confirmed | `cursor-agent login` or `CURSOR_API_KEY` |
| `codex` | `codex exec --json` | `npx skills add <plugin> -a codex` | stdout, parsed liberally until the event schema is confirmed | a working `codex` install |

Details that affect results:

- The Claude adapter refuses to trust a run where the init event lists more than one plugin besides Claude Code's built-in ones. That means the throwaway config directory failed to isolate the run and installed plugins leaked in, so the run is marked with an error naming them. It deliberately does not use `--bare`, which would isolate too but drops keychain login.
- Antigravity only sees the installed skills when the working directory is registered with `--add-dir`; the runner always passes the absolute path. Its tool calls take tens of seconds each, so a case runs for minutes. It reports no cost, so the summary shows `n/a`.
- The Skills CLI installer initialises a git repository in the working directory first, because the CLI expects one, and installs with `--copy` so the run does not depend on symlinks into the repo.
- `exec` caps any host at ten minutes and reports `timed out` as the run's error. Raise `max_turns` in the case before assuming the skill is at fault.

## Adding a host

1. Create `hosts/<name>.ts` exporting a `HostAdapter`. Copy `cursor.ts` as the starting point: it is the smallest adapter.
2. Add the name to the `HostName` union in `types.ts` and to the registry in `hosts/index.ts`.
3. Decide how the host reaches the skills. If it reads `.agents/skills/` or a similar project directory, `installWithSkillsCli` from `process.ts` does the installation the way a user would; pass the agent name the Skills CLI uses for that host. If it has its own plugin mechanism, pass the plugin directory on the command line instead.
4. Run one case with `--case` and open the transcript in the output directory. Confirm `parse` returns tool calls with their inputs and a non-empty reply; a run that fetched pages but shows no `urls:` line means the inputs are not being found.
5. Run the same case with `--baseline` and confirm no skill check fires, which proves the skill is not leaking in from elsewhere on the machine.
6. Once the host's JSON event schema is understood, replace `parseLiberally` with a parser that reads the known fields, and record the schema in the adapter's header comment.

## The JSON result

`--json` writes one document per suite run:

| Field | Content |
|---|---|
| `host`, `hostVersion`, `model`, `withSkill`, `runsPerCase`, `startedAt` | How the suite was run |
| `cases[]` | One entry per case: `name`, `aggregates` (`score`, `passRate`, `runsWithErrors`) and `runs[]` |
| `cases[].runs[]` | `passed`, `score`, `turns`, `costUsd`, `judgeCostUsd`, `error`, `checks[]` (`name`, `passed`, `scored`, `detail`), `toolCalls[]` (tool names in order), `skillsUsed[]`, `transcriptPath` |
| `aggregates` | `casesTotal`, `casesPassed`, `overallScore`, `overallPassRate`, `runsWithErrors` |
| `costUsd` | Total spend including judge calls, or `null` when nothing reported it |

A case counts as passed when every one of its runs passed. `overallScore` is the mean of the case scores, and a case score is the mean of its run scores.

## Comparing runs

Two comparisons answer most questions. Whether the skill helps at all is the suite with the skill against `--baseline`, same host and model. Whether a change fixed or broke something is the suite on the branch against the same suite on `main`, same host and model. For the second, run the branch's runner and cases against a checkout of `main`'s plugin:

```bash
mkdir -p /tmp/ap-main && git archive origin/main | tar -x -C /tmp/ap-main
node scripts/evals/run-host.ts --host claude --plugin /tmp/ap-main/plugins/integrations/stackone-platform
```

The cases come from `cases/stackone-platform/` on the branch because they are keyed by the plugin directory's name, so nothing has to be copied.
