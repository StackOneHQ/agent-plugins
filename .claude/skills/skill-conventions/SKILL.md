---
name: skill-conventions
description: House style for SKILL.md files in this marketplace — structure, frontmatter, references/ layout, and writing conventions. Background knowledge for writing or editing any plugin skill.
user-invocable: false
---

# Skill Conventions

Every skill in this repo follows the same design philosophy: **teach workflows** while pointing to **live documentation** for details that change frequently. The canonical source of truth is [docs.stackone.com](https://docs.stackone.com) — skills must not duplicate API reference content that will go stale.

## Frontmatter

- `name`: matches the plugin name and the skill directory name (`skills/<name>/SKILL.md`).
- `description`: states what the skill does **and** the trigger phrases a user would say, e.g. `"Set up StackOne", "list my accounts", "debug API errors"`. The description is how Claude decides to invoke the skill — write it for that decision, not as marketing copy.

## Structure

1. **Step-by-step workflows** for common tasks — numbered instructions an agent can follow, not just concept explanations.
2. **Real user scenario examples** in trigger → actions → result form: the user's literal request, the steps the agent takes, and what the user ends up with.
3. **Error handling and troubleshooting** for common failure modes — symptom, cause, fix.
4. **`references/` directory** for detailed lookup tables (connector lists, field mappings, API parameter tables) that are loaded on demand, keeping SKILL.md itself short enough to read in one pass.
5. **Live-docs pointers** — when behavior depends on something that changes (SDK versions, connector catalogs, API specs), instruct the agent to fetch the latest from docs.stackone.com or the SDK README at runtime instead of hardcoding it.

## Writing style

- Address the agent directly with imperative instructions ("Run X", "Fetch Y before Z").
- Keep SKILL.md under ~500 lines; push anything table-shaped into `references/`.
- Relative links into `references/` must resolve from the SKILL.md location — check them after moving files.
- Every code block should be copy-paste runnable; placeholder values use `<angle-brackets>`.
