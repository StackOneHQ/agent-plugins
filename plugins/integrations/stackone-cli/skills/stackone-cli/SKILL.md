---
name: stackone-cli
description: Build, test and deploy custom StackOne connectors using the StackOne CLI and the user's agent. Use when user asks to "build a custom connector", "customize an existing connector", "deploy my connector", "use the StackOne AI builder", "set up CI/CD for connectors", "test my connector locally", "write connector YAML", or "install the StackOne CLI". Covers the full connector development workflow from setup through deployment. Do NOT use for using existing connectors (use stackone-connectors) or building AI agents (use stackone-agents).
license: MIT
compatibility: Requires Node.js and npm. Requires network access to fetch live documentation from docs.stackone.com.
metadata:
  author: stackone
  version: "2.1"
---

# StackOne CLI — Connector Development

## Important

The CLI is actively developed and commands change between versions. Before providing CLI guidance:
1. Fetch `https://docs.stackone.com/connector-building/stackone-cli.md` for the current command reference
2. Fetch `https://www.npmjs.com/package/@stackone/cli` for the latest version

Do not guess CLI commands or flags — always verify against live docs.

When fetching any `docs.stackone.com` page, append `.md` to the URL to get it as markdown. `llms.txt` is already plain text, so fetch it as is.

**If any URL in this skill returns 404, or a page doesn't cover what you need** (StackOne reorganizes its docs from time to time):
- Fetch `https://docs.stackone.com/llms.txt`, which indexes every docs page by title and description. Search it for the page's topic (e.g. "Connector Building", "StackOne CLI", "Connector YAML Reference", "Expression Language") and use the URL listed there.
- For the CLI itself, the npm package page is the fallback: `https://www.npmjs.com/package/@stackone/cli`.

## Instructions

### Step 1: Understand when to build a custom connector

Custom connectors are for providers StackOne doesn't support yet, internal systems, or actions a standard connector lacks. Before building one:
- Check if the provider already exists: use the `stackone-connectors` skill or browse `https://docs.stackone.com/connectors/introduction.md`
- If the provider exists but is missing specific actions, customize the existing connector instead of starting from scratch. Fetch `https://docs.stackone.com/connector-building/customizing-connectors.md` (pull, edit, test, push)
- Custom connectors need Enterprise access. Fetch `https://docs.stackone.com/connector-building/overview.md` for the options, including asking StackOne to build it

### Step 2: Set up the CLI and agent

Fetch `https://docs.stackone.com/connector-building/first-connector.md` and follow its setup steps in order. The flow changes between CLI versions, so take the steps, commands, API key scopes and prerequisites from the page, not from this skill.

### Step 3: Build the connector

Connectors are YAML. Follow the First Connector guide's build step for the current recommended way to build one.

For the build loop (authentication first, then actions, then iterate), fetch `https://docs.stackone.com/connector-building/build-workflow.md`.

For YAML questions (fields, step functions, expressions), fetch `https://docs.stackone.com/connector-yaml-reference/overview.md` and follow its links. The expression language and each step function have their own reference page.

### Step 4: Validate and test locally

Validate the YAML and run single actions against the provider before deploying. Fetch the CLI reference for the exact flags and the local account, credentials and params file formats:
`https://docs.stackone.com/connector-building/stackone-cli.md`

### Step 5: Deploy

Push the connector to the project's registry with the CLI. For automated deployments from GitHub Actions, fetch:
`https://docs.stackone.com/connector-building/github-ci-cd.md`

For releasing changes without breaking linked accounts, fetch `https://docs.stackone.com/connector-building/connector-versioning.md`.

## Examples

### Example 1: User wants to build a connector for an internal API

User says: "We have an internal HR system. Can I connect it to StackOne?"

Actions:
1. Fetch `https://docs.stackone.com/connector-building/first-connector.md`
2. Walk through its steps in order, from setup to pushing the connector, quoting its commands exactly

Result: Custom connector built, tested and pushed to their project.

### Example 2: User wants to set up CI/CD for connector deployment

User says: "How do I auto-deploy connectors from GitHub?"

Actions:
1. Fetch `https://docs.stackone.com/connector-building/github-ci-cd.md`
2. Walk through adding the API key secret and the workflow file
3. Explain how branches map to separate StackOne projects, as the guide describes

Result: Working GitHub Actions pipeline for connector deployment.

## Troubleshooting

### CLI command not found after install
**Cause**: Global npm bin directory not in PATH.
- Run `npm config get prefix` to find the install location
- Add `{prefix}/bin` to your PATH
- Alternatively, use `npx @stackone/cli` instead of the global command

### Authentication failures in CLI
**Cause**: Missing profile, or an API key without the scopes the command needs.
- Fetch the CLI reference. It lists the scope each deployment command requires
- Check the profile passed with `--profile` exists (the CLI reference names the command that creates one)
- Verify the key is active at https://app.stackone.com

### Connector validation or deployment fails
**Cause**: Various — check the error message.
- Run the CLI's validate command on the connector directory and fix what it reports
- Fetch the Build Workflow guide's debugging section for common symptoms and causes
- For CI/CD failures, fetch the GitHub CI/CD guide's common errors section and check the secrets are configured

## Related Skills

- **stackone-unified-connectors**: For building schema-based connectors that transform provider data into standardized schemas with field mapping, enum translation, and unified pagination
- **stackone-connectors**: For discovering existing connector capabilities
- **stackone-agents**: For building AI agents that use connectors
