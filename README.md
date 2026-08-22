# StackOne Plugins for Agents

Agent plugins made by [StackOne](https://stackone.com) — integration infrastructure for AI agents, plus a prompt-injection defense hook.

## Install

### Claude Code (plugin marketplace)

```bash
# Add the marketplace
/plugin marketplace add stackonehq/agent-plugins

# Browse the catalog interactively (Discover tab)
/plugin

# Install any plugin (one per skill)
/plugin install stackone-platform@stackone-agent-plugins
/plugin install stackone-connect@stackone-agent-plugins
/plugin install stackone-agents@stackone-agent-plugins
/plugin install stackone-connectors@stackone-agent-plugins
/plugin install stackone-cli@stackone-agent-plugins
/plugin install stackone-unified-connectors@stackone-agent-plugins
/plugin install stackone-defender@stackone-agent-plugins

# The hosted StackOne MCP connector (tools for 30,000+ actions, OAuth sign-in)
/plugin install stackone@stackone-agent-plugins
```

### Any agent (via Skills CLI)

```bash
# Install all skills (works with Claude Code, Cursor, Codex, Windsurf, etc.)
npx skills add stackonehq/agent-plugins

# Install a specific skill
npx skills add stackonehq/agent-plugins@stackone-agents
```

## Available Plugins

| Plugin | Category | What it does | When to use |
|--------|----------|--------------|-------------|
| [`stackone-platform`](plugins/integrations/stackone-platform/) | Integrations | API keys, accounts, logs, debugging | "Set up StackOne", "list my accounts", "debug API errors" |
| [`stackone-connect`](plugins/integrations/stackone-connect/) | Integrations | Account linking via Connect Sessions and the Hub component | "Connect a provider", "embed the integration picker" |
| [`stackone-agents`](plugins/integrations/stackone-agents/) | Integrations | Build AI agents with TypeScript/Python SDK, MCP, or A2A | "Add StackOne tools to my agent", "set up MCP" |
| [`stackone-cli`](plugins/integrations/stackone-cli/) | Integrations | Custom connector development and deployment | "Build a custom connector", "deploy my connector" |
| [`stackone-connectors`](plugins/integrations/stackone-connectors/) | Integrations | Discover connectors, actions, and integration capabilities | "Which providers does StackOne support?" |
| [`stackone-unified-connectors`](plugins/integrations/stackone-unified-connectors/) | Integrations | Build unified connectors that transform provider data into standardized schemas | "Start unified build for [provider]", "map fields to schema" |
| [`stackone-defender`](plugins/security/stackone-defender/) | Security | Detect prompt injection and jailbreak attacks in tool results using local ML | "Scan for prompt injection", "is this text safe?", "protect my agent" |
| [`stackone`](https://github.com/StackOneHQ/stackone-plugin) | Connector | StackOne's hosted MCP server as a plugin: search and run actions across every linked account (maintained in its own repo, also listed for Grok Build, Cursor and Codex) | "Use StackOne to create a Jira issue", "list my connected accounts" |

Each plugin includes a focused skill, step-by-step workflows, concrete examples, and troubleshooting.

## Repository Structure

```
agent-plugins/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace manifest — lists all plugins
└── plugins/
    ├── integrations/
    │   ├── stackone-platform/
    │   ├── stackone-connect/
    │   ├── stackone-agents/
    │   ├── stackone-connectors/
    │   ├── stackone-cli/
    │   └── stackone-unified-connectors/
    └── security/
        └── stackone-defender/    # ships its own hooks/, scripts/, package.json
```

Each plugin directory contains its own `.claude-plugin/plugin.json`, a `skills/<name>/` folder, and (for `stackone-defender`) the PostToolUse hook config plus ML scripts.

## Design Philosophy

These skills **teach workflows** while pointing to **live documentation** for details that change frequently:

- Step-by-step instructions for common tasks (not just API reference)
- Real user scenario examples with trigger → actions → result
- Error handling and troubleshooting for common failure modes
- `references/` directories for detailed lookup tables loaded on demand
- Agents fetch the latest docs, SDK READMEs, and API specs at runtime
- The canonical source of truth remains [docs.stackone.com](https://docs.stackone.com)

## Documentation Index

StackOne publishes a machine-readable documentation index at [`docs.stackone.com/llms.txt`](https://docs.stackone.com/llms.txt) — agents can fetch this to discover all available documentation pages.

## Resources

- [StackOne Documentation](https://docs.stackone.com)
- [StackOne Dashboard](https://app.stackone.com)
- [AI Playground](https://app.stackone.com/playground)
- [TypeScript SDK (`@stackone/ai`)](https://www.npmjs.com/package/@stackone/ai)
- [Python SDK (`stackone-ai`)](https://github.com/stackoneHQ/stackone-ai-python)
- [CLI (`@stackone/cli`)](https://www.npmjs.com/package/@stackone/cli)
- [Hub React Component (`@stackone/hub`)](https://www.npmjs.com/package/@stackone/hub)

## License

MIT
