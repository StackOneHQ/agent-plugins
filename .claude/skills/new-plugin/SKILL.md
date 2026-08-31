---
name: new-plugin
description: Scaffold a new plugin in this marketplace — plugin directory, plugin.json, SKILL.md, marketplace.json entry, and release-please extra-files entry. Use when adding a new plugin to the repo.
disable-model-invocation: true
---

# New Plugin Scaffold

Adding a plugin touches **five** places. Missing any one of them either breaks CI validation or silently desyncs versioning. Work through the checklist in order.

## Arguments

`/new-plugin <name> [category]` — `category` is `integrations` (default) or `security`.

## Checklist

### 1. Plugin directory and manifest

Create `plugins/<category>/<name>/.claude-plugin/plugin.json`:

```json
{
  "name": "<name>",
  "version": "<current repo version from .release-please-manifest.json>",
  "description": "<one-line description — what it does and when to use it>",
  "author": {
    "name": "StackOne",
    "email": "engineering@stackone.com"
  },
  "license": "MIT"
}
```

Use the version from `.release-please-manifest.json` so the new plugin starts in sync with the repo.

### 2. Skill

Create `plugins/<category>/<name>/skills/<name>/SKILL.md` following the house style (see the `skill-conventions` skill): workflow-first instructions, trigger → actions → result examples, troubleshooting section, and a `references/` directory for lookup tables loaded on demand. Point to live docs at docs.stackone.com for anything that changes frequently.

### 3. Plugin README

Create `plugins/<category>/<name>/README.md` — what the plugin does, install instructions, and example prompts.

### 4. Marketplace entry

Add an entry to the `plugins` array in `.claude-plugin/marketplace.json`:

```json
{
  "name": "<name>",
  "source": "./plugins/<category>/<name>",
  "description": "<same one-liner as plugin.json>",
  "version": "<same version as plugin.json>",
  "category": "<category>",
  "tags": ["stackone", "..."],
  "author": {
    "name": "StackOne",
    "email": "engineering@stackone.com"
  }
}
```

Also add a row to the "Available Plugins" table in the root `README.md` and the tree in "Repository Structure".

### 5. Release-please version tracking — easy to forget

Add an `extra-files` entry to `.release-please-config.json` under `packages.".".extra-files`:

```json
{
  "type": "json",
  "path": "plugins/<category>/<name>/.claude-plugin/plugin.json",
  "jsonpath": "$.version"
}
```

If the plugin ships its own `package.json` (like `stackone-defender`), add a second entry for that file's `$.version` too. Without this step the plugin's version stops tracking releases.

### 6. Validate and commit

```bash
npx --yes @anthropic-ai/claude-code plugin validate .
```

Commit with a conventional-commit message so release-please picks it up:

```
feat(<name>): add <name> plugin — <short description>
```
