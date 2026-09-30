# Eval cases

Regression cases for the integration plugins, graded the same way on every agent host. Each case is a prompt a user might type plus host-neutral checks on the outcome: which documentation URL the agent fetched, which package, field and action names its reply used, and optionally a list of facts a model judges the reply against. Which skill took the question is printed for diagnosis but never graded.

Cases are grouped by the plugin whose territory the question is in, one directory per plugin, and a run loads only that plugin. Most prompts come from real support conversations, rephrased as questions and anonymised. Two kinds of case sit alongside the documented ones: questions in a plugin's territory that the docs do not answer, and questions no plugin covers. For both, the right reply says the docs do not cover it and points to StackOne support, and the checks fail if the agent invents an answer instead.

## Cases

Documented answers:

| Case | Plugin | Checks |
|---|---|---|
| `debug-401` | platform | fetches `/platform-api/authentication`, never the retired `/overview/authentication` |
| `list-linked-accounts` | platform | reply uses `/v2/accounts`, `connector`, `owner_id`; never `origin_owner_id` or the v1 reference |
| `rate-limit-429` | platform | fetches `/platform-api/rate-limiting`, never the retired `/overview/rate-limits` |
| `retry-backoff-guidance` | platform | fetches the rate limiting page; reply mentions `Retry-After`; facts: wait for the header, no documented retry count |
| `configure-webhooks` | platform | fetches the Webhooks guide or the Platform Events reference; never the retired `/guides/webhooks` |
| `account-disconnect-notification` | platform | fetches Handle Account Events or Webhooks; reply names the `account.*` events |
| `find-request-logs` | platform | fetches the Troubleshooting guide or the List Logs reference |
| `log-request-source` | platform | fetches the logs docs; reply names `source_type` or `source_id`; facts: no fields beyond the reference |
| `create-api-key` | platform | fetches the API Keys page |
| `api-key-for-jobadder` | platform | fetches the API Keys page and the JobAdder docs; facts keep the API key and JobAdder's OAuth app distinct |
| `account-status-meaning` | platform | fetches the v2 accounts reference, never the v1 one; reply avoids `origin_owner_id` |
| `accounts-by-connector-profile` | platform | fetches the v2 accounts reference; reply uses `connector_profile_id` |
| `accounts-no-credentials` | platform | fetches the accounts reference or concept page; never names a credentials endpoint; facts: absent by design, ask support |
| `org-project-account-hierarchy` | platform | fetches the concepts or multi-tenant pages; facts: organisation, project, account and what isolates what |
| `add-org-member` | platform | fetches Manage Team; reply mentions inviting or Admin |
| `data-sync-off-map` | platform | a topic the skill's map does not list: fetches `llms.txt` and then a Data Sync page, proving index-first routing |
| `embed-hub-in-react` | connect | fetches the Hub or Connect Session docs; reply names `@stackone/hub`, a connect session and `origin_owner_id` |
| `oauth-app-whose-credentials` | connect | fetches Use Your Own OAuth Apps; facts: one app, customers authorise through it |
| `langchain-agent-tools` | agents | fetches the Agent SDK or MCP docs; reply names `stackone-ai` or the MCP adapters and the LangChain conversion |
| `jobadder-mcp-link-first` | agents | fetches the JobAdder and MCP docs; facts: link first, OAuth app in the Developer Portal |
| `helpscout-to-claude` | agents | fetches the Help Scout and Claude Desktop docs; reply mentions MCP; facts: profile, custom connector URL, consent |
| `limit-tools-in-agent-context` | agents | fetches Advanced Tool Search, Tool Discovery or Scoping Connectors |
| `workday-actions-available` | connectors | fetches the Workday connector page; reply names at least one `workday_*` action |
| `workday-user-impersonation` | connectors | fetches the Workday docs; reply names the user login flow auth types |
| `workday-documents` | connectors | fetches the Workday page; reply names a `workday_*document*` action, against a stale support reply that said none existed |
| `sap-erp-connector` | connectors | fetches the SAP S/4HANA page; reply names S/4HANA |
| `manatal-zinc-sonavate` | connectors | fetches the Manatal and Zinc pages; never a `connectors/sonavate` URL; facts: two exist, one does not |
| `paylocity-available` | connectors | fetches the Paylocity page |
| `connector-catalog-endpoint` | connectors | fetches the v2 Connectors reference, the RPC page or Actions Metadata for Custom UIs; reply names `/connectors` or `/actions` |
| `soap-conditional-element` | cli | fetches the expression language or soap_request reference; reply uses `present(` |
| `cursor-pagination-next` | unified-connectors | fetches the paginated_request reference; reply mentions the cursor |

Graceful no. The reply must point to StackOne support, and the facts fail it for inventing a setting, a value or a field:

| Case | Plugin | Why the docs cannot answer it |
|---|---|---|
| `passthrough-idle-timeout` | platform | no timeout is documented; `no_reply` fails any number of seconds |
| `log-pii-redaction` | platform | no redaction feature is documented |
| `sap-per-user-auth` | connectors | the SAP page documents OAuth profiles only |
| `plaid-redirect-uri` | connectors | the Plaid page does not say which redirect URI to use |
| `rename-organisation` | platform (no plugin covers it) | dashboard administration, no page |
| `connector-billing` | platform (no plugin covers it) | pricing is not in the developer docs |
| `teams-publisher-attestation` | connectors (no plugin covers it) | partner and legal process, no page |

The three "no plugin covers it" cases sit with the nearest plugin and carry `skill_should_fire: false`; they check that the skill neither answers nor invents.

Checks match exact URLs and backticked field names rather than prose, because phrasing changes between runs and hosts and those strings do not.

## How a run works

1. `scripts/evals/run-host.ts` starts the chosen host headless in a throwaway working directory. Claude Code also gets a throwaway config directory and loads the plugin with `--plugin-dir`; every other host gets the plugin's skill installed into the working directory with `npx skills add -a <agent>`, the way a user installs it. Only the plugin under test is present, and nothing personal or project-level is.
2. It sends the case's `prompt` as the user's message and lets the agent work until it finishes or hits `max_turns`.
3. It normalises the host's transcript to the tool calls made, with their inputs, and the final reply.
4. Each check in the case file passes or fails against that. A run's score is the share of scored checks that passed; a case's score is the mean over its runs. Cases with `reference[]` also get one judge call per run.
5. `--baseline` runs the same prompts with no skill installed, so the skill's contribution is visible.

The repo does not use `claude plugin eval`. One grading implementation across hosts was chosen over a second, Claude-only one that could disagree with it.

## Layout

```
scripts/evals/
  run-host.ts                 the runner, shared by every plugin in this repo
  cases/
    README.md                 this file
    <plugin>/<case>.json      one file per case: the prompt, an optional turn cap, the checks
```

The cases sit beside the runner rather than inside the plugins, so the plugins ship without test fixtures. The runner finds a plugin's cases by its directory name: `--plugin plugins/integrations/stackone-platform` reads `cases/stackone-platform/`.

## The case file

| Field | Meaning |
|---|---|
| `prompt` | what the user types, sent unchanged |
| `max_turns` | optional turn cap for the agent; 12 when absent |
| `skill` | the skill whose territory the prompt is in, used by the fired indicator |
| `skill_should_fire` | whether you expect that skill to be used; reported per run, never scored |
| `skill_note` | why that skill should or should not be the one answering; for the reader, the runner ignores it |
| `fetch[]` | `{name, match, note}`: some tool call's input must match `match` |
| `no_fetch[]` | no tool call's input may match |
| `reply[]` | the final reply must match |
| `no_reply[]` | the final reply must not match |
| `reference[]` | the facts a correct answer states, one per entry; a model judges the reply against each for coverage and contradiction, reported as indicators until the runner is passed `--score-reference` |

`match` is a JavaScript regex source, applied to the JSON-encoded tool input or to the reply text. "Fetched" means any tool whose input matches, whatever the host calls its fetch tool. Put backticks around field names (`` `connector` ``) so the check does not match the word "connectors" in prose.

Which skill fired is never scored. A right answer reached through a different route than expected is still a right answer, hosts reach skills differently (Claude Code has a `Skill` tool, other hosts read the `SKILL.md` file), and a baseline run has no skill to fire. The runner prints a `skills:` line per run listing every skill it reached, so an over-triggering description is visible without deciding a verdict. Detection is either an explicit skill-invocation call naming the skill or a read of `skills/<skill>/SKILL.md`.

## Running

```bash
# one plugin's cases on Claude Code, one run each
node scripts/evals/run-host.ts --host claude --plugin plugins/integrations/stackone-platform

# one case, three runs, machine-readable result
node scripts/evals/run-host.ts --host claude --plugin plugins/integrations/stackone-platform --case debug-401 --runs 3 --json out.json

# one case, three runs, on a stronger model; --case also accepts a name prefix
node scripts/evals/run-host.ts --host claude --plugin plugins/integrations/stackone-connect --case embed-hub-in-react --runs 3 --model opus

# the same prompts with no skill installed
node scripts/evals/run-host.ts --host claude --plugin plugins/integrations/stackone-platform --baseline

# other hosts
node scripts/evals/run-host.ts --host cursor --plugin plugins/integrations/stackone-platform --model sonnet-4
node scripts/evals/run-host.ts --host codex  --plugin plugins/integrations/stackone-platform --model gpt-5

# every plugin's cases
for p in plugins/integrations/*/; do node scripts/evals/run-host.ts --host claude --plugin "$p"; done
```

The runner is TypeScript that Node 22.18 or later executes directly, with no dependencies at run time. To typecheck it, `npm --prefix scripts/evals install` once, then `npm --prefix scripts/evals run typecheck`. Host adapters live one per file under `scripts/evals/hosts/`.

Exit status is 1 when any case has a failing run. `--json` writes `host`, `hostVersion`, `model`, `withSkill`, per-case `aggregates` and per-run `checks`, plus overall `aggregates` and `costUsd`. Every run's transcript and stderr are kept in the output directory printed at the start.

### Hosts

How each host is launched, where its transcript comes from, what it needs to be signed in, and how to add a new one are documented in [`scripts/evals/README.md`](../README.md). Two things from there matter when reading results: pin `--model` when comparing runs, so a score change is attributable to the skill and not to a model swap, and remember that hosts name their fetch tools differently (`WebFetch` on Claude Code, `read_url_content` on Antigravity, which also appends `.md` to docs URLs). Checks match on the tool input, never the tool name, for exactly this reason.

### Two comparisons

| Question | Run |
|---|---|
| Does the skill help at all? | with the skill and with `--baseline`, same host and model |
| Did my change fix or break something? | the suite against `main` and against your branch, same host and model |

```bash
mkdir -p /tmp/ap-main && git archive origin/main | tar -x -C /tmp/ap-main
node scripts/evals/run-host.ts --host claude --plugin /tmp/ap-main/plugins/integrations/stackone-platform
```

The cases come from this directory on your branch, keyed by the plugin directory's name, so nothing is copied; only the plugin under test comes from `main`. A case that fails on `main` and passes on the branch is the regression signal.

## Adding a case

1. Put the file in the directory of the plugin whose territory the question is in, and name it after the user's situation (`debug-401.json`), not after the fix. Related cases can share a name prefix so `--case <prefix>` runs them together.
2. Write the `prompt`: what a user would type, with no hint toward the answer you want. Phrase it as a question that can be answered in the reply ("How do I..., show me the code"), not as an instruction to build something: the run's working directory is empty and only fetching and skills are allowed, so "embed X in my app" ends with the agent asking where the app is or asking for write permission, and there is no reply to grade. Add `max_turns` only when 12 is not enough; a case that fetches several pages may need 16.
3. Write the checks, one entry each. The string checks are deterministic and free. If the answer has substance worth judging, add `reference[]`: the facts a correct answer states, written from the docs page, kept to the essentials. That adds one model call per run. For a question the docs cannot answer, the reply check is "contact StackOne support" and the facts say what the agent must not invent.
4. Run the case against `main` first. If it already passes there it is not testing your change; sharpen the check or drop the case.
5. Run it against your branch. Fail on `main`, pass on the branch, is the result you want.
6. Run it on every host the plugin ships to.

## Maintaining cases

| Situation | Do |
|---|---|
| A docs URL moves | Update `match` in the `fetch` entry. If the old path now returns 404, add it to `no_fetch` so nobody reintroduces it. |
| A case passes on some runs and fails on others | Run it at least three times. A regression fails every run; a flaky trigger passes some. Sharpen the prompt or the skill's description. Do not loosen the check. |
| A skill's "Do NOT use for" list changes | Add an outcome case in the other plugin's directory, so its suite proves the question still gets answered from the right docs. |
| The `skills:` line shows the skill firing on a question it should not own | The outcome checks decide the verdict, so this is a cost and clarity problem rather than a failure. Sharpen the description with the other plugin's concrete terms, and rerun to confirm the outcome still holds. |
| A check passes on `main` | It is a sanity check, not a regression check. Keep it only if it guards something the change could break. |
| A reference fact is reported missing or contradicted | Read the judge's `detail` and the reply. A contradiction on a correct-looking reply is a real finding about the skill or the docs. A fact reported missing on replies that are otherwise right is usually not essential; drop it from `reference[]` rather than reword it until the judge agrees. |
| The docs gain a page for a graceful-no case | Turn it into a documented case: the fetch anchor becomes that page and the facts become what it says. The support wording stops being the expected answer. |
| A run fails and you are tempted to edit the check | Read the run's transcript in the output directory first. The runner prints the URLs each run touched; most failures are the agent fetching a page you did not expect, which is information about the skill, not the check. |
| A run reports a turn-cap error | The checks ran on a truncated transcript, so the verdict is ambiguous. Raise `max_turns` in the case file until healthy runs finish well under it. A skill that sends the agent through several dead pages needs more turns than one that fetches once, and the baseline arm has no skill at all. |
| A host's score differs from another's | Compare the transcripts before blaming the skill. Hosts default to different models and expose different tools; pin `--model` and check which tool each host used to fetch. |
| Cost climbs | String checks cost nothing; each agent run costs model tokens, plus a few cents per judge call for cases with `reference[]`. Iterate with a cheaper `--model` and `--case`; run the full suite on each host's default model before merging, since that is what most users of the skill will be on. |
