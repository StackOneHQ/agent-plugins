---
name: context-mode
description: Install and use Context Mode — the context window optimizer for AI coding agents. Saves 40-60% of context by auto-indexing tool output into FTS5, persisting session state through compaction, and enabling cross-session search. Supports Pi, Claude Code, Cursor, Codex, and 15+ platforms. Use when user asks about "context-mode", "context window", "tool output indexing", "session continuity", "installing context-mode", "ctx batch execute", "ctx search", or "FTS5 knowledge base". Do NOT use for StackOne integration tasks (use stackone-agents, stackone-platform, etc.).
license: Elastic-2.0
compatibility: Requires Node.js >= 22.5 or Bun. Works as Pi extension (auto-routing), Claude Code plugin (hook-based), or MCP server (manual routing).
metadata:
  author: mksglu (Reza)
  version: "1.0.0"
---

# Context Mode

**The other half of the context problem.**

Context Mode is an extension (+ skill) that solves one problem: **every MCP tool call dumps raw data into your context window**. A Playwright snapshot costs 56 KB. Twenty GitHub issues cost 59 KB. One access log — 45 KB. After 30 minutes, 40% of your context is gone. And when the agent compacts the conversation to free space, it forgets which files it was editing, what tasks are in progress, and what you last asked for.

Context Mode intercepts tool output, auto-indexes it into a persistent FTS5 knowledge base, and injects only the **derived summary** into context — saving 40-60% of your context window. On compaction, it captures a **Session Guide** so the agent resumes with full working state.

## Available Tools

| Tool | Purpose |
|------|---------|
| `ctx_execute` | Run code in sandbox; only `console.log()` output enters context |
| `ctx_execute_file` | Read a file into sandbox variable; only derived summary enters context |
| `ctx_batch_execute` | Run multiple commands, auto-index all output, query inline |
| `ctx_search` | Search the FTS5 knowledge base (indexed content + session memory) |
| `ctx_index` | Index content (docs, READMEs, API refs) into searchable knowledge base |
| `ctx_fetch_and_index` | Fetch URL content, convert to markdown, index without touching context |
| `ctx_stats` | Show context savings, token consumption, per-tool breakdown |
| `ctx_doctor` | Diagnose context-mode installation |
| `ctx_purge` | Delete indexed content (destructive — requires confirmation) |
| `ctx_insight` | Launch analytics dashboard in browser |
| `ctx_upgrade` | Upgrade to latest version |

## Install

### Option A — Pi (extension, automatic routing)

```bash
# Install globally
npm install -g context-mode

# Install into Pi
pi install npm:context-mode

# Verify
ctx_stats
```

### Option B — Claude Code (hook-based, automatic routing)

```bash
# Via plugin marketplace
/plugin install context-mode

# Or directly
npm install -g context-mode
/plugin add context-mode
```

### Option C — Any agent (MCP server, manual routing)

```bash
npm install -g context-mode
```

Then add to your MCP config:

```json
{
  "mcpServers": {
    "context-mode": {
      "command": "context-mode"
    }
  }
}
```

### Option D — Any agent (via npx skills)

```bash
npx skills add mksglu/context-mode
```

### Verify

After install, run any of these:
- `ctx_stats` — shows context savings and tool usage
- `ctx_doctor` — diagnostic report
- `ctx_search(queries: ["hello"])` — quick smoke test

## Usage Patterns

### Think-in-Code: Keep raw bytes out of context

Instead of reading files or dumping output, run code in the sandbox and print only the answer:

```
ctx_execute(language: "javascript", code: `
  const files = fs.readdirSync('src').filter(f => f.endsWith('.ts'));
  files.forEach(f => {
    const lines = fs.readFileSync('src/'+f,'utf8').split('\\n').length;
    console.log(f + ': ' + lines + ' lines');
  });
`)
```

### Batch + Search: Gather data, get answers in one round trip

```
ctx_batch_execute(
  commands: [
    {label: "issues", command: "gh issue list --json number,title,labels --limit 50"},
    {label: "prs", command: "gh pr list --json number,title,state --limit 20"}
  ],
  queries: ["bug", "security", "priority"],
  concurrency: 2
)
```

### Fetch docs without context pollution

```
ctx_fetch_and_index(
  url: "https://docs.stackone.com/llms.txt",
  source: "stackone-docs"
)
// Later, search it:
ctx_search(queries: ["API keys", "linked accounts"], source: "stackone-docs")
```

## Session Continuity

Context Mode persists session state across compaction via a **Session Guide** — a structured snapshot with these categories:

- **Last Request** — user's last prompt so agent continues seamlessly
- **Active Files** — files being edited with line ranges and content hashes
- **Active Tasks** — tasks in progress with open file, description, and checkpoints
- **Rules** — active project rules paths
- **Decisions** — user corrections, preference changes, and accepted/rejected approaches
- **Errors & Resolutions** — error → resolution pairs
- **Blockers** — open and resolved blockers
- **Git** — operations performed (checkout, commit, push)
- **MCP Tools Used** — tool names with call counts
- **Rejected Approaches** — tool calls the user denied

## Platform Support

Context Mode runs on **15+ agent platforms** including:
Pi, Claude Code, Qwen Code, Gemini CLI, VS Code Copilot, JetBrains Copilot, Cursor, Codex CLI, OpenCode, KiloCode, Kiro, Zed, and more.

| Feature | Pi | Claude Code | Cursor | Codex |
|---------|:--:|:-----------:|:------:|:-----:|
| MCP Tools | ✅ extension | ✅ hook | ✅ plugin | ✅ hook |
| PreToolUse Hook | ✅ | ✅ | ✅ | ✅ |
| PostToolUse Hook | ✅ | ✅ | ✅ | ✅ |
| SessionStart Hook | ✅ | ✅ | — | ✅ |
| PreCompact Hook | ✅ | ✅ | — | ✅ |
| Block Tools | ✅ | ✅ | ✅ | ✅ |

## Resources

- **Homepage**: https://pi.dev/packages/context-mode
- **Repository**: https://github.com/mksglu/context-mode
- **npm**: https://www.npmjs.com/package/context-mode
- **Discord**: https://discord.gg/DCN9jUgN5v
- **License**: Elastic-2.0