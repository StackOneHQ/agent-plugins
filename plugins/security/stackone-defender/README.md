# stackone-defender

On-device prompt-injection and jailbreak detection for Claude Code. Runs as a `PostToolUse` hook and surfaces flagged tool results to the model.

## Install

```bash
/plugin marketplace add stackonehq/agent-plugins
/plugin install stackone-defender@stackone-agent-plugins
```

On first run, the hook self-installs its ML dependencies (`@stackone/defender`, `onnxruntime-node`, `@huggingface/transformers`, `fasttext.wasm`) into the plugin's own `node_modules`. Subsequent runs reuse the persistent daemon over a Unix socket at `~/.claude/defender.sock`.

## How it works

- A long-lived daemon (`scripts/defender-daemon.mjs`) keeps the classifier in memory.
- The hook (`scripts/scan-tool-result.mjs`) ships every tool result to the daemon and returns either silent-pass or one-line JSON with a flag.
- The bundled skill teaches Claude how to interpret flags — they are a quiet review hint, not a verdict, and not something to surface to the user unless a real attack is confirmed.

Flagged scans are not persisted anywhere — local or remote. The hook only injects an `additionalContext` line into Claude's next turn; there is no telemetry and no feedback path.
