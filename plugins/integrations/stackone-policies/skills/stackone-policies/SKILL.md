---
name: stackone-policies
description: Build StackOne access policies (Cedar allow or deny rules over MCP tool calls) that are complete and verified before they are saved. Use when the user asks to block, allow, restrict, or limit tool calls for a person, an AI client (claude, chatgpt, cursor), an account, or everyone, for example "stop chatgpt from deleting anything" or "only let this account read". Do NOT use to discover connectors or actions (use stackone-connectors) or for general platform setup such as API keys and webhooks (use stackone-platform).
license: MIT
metadata:
  author: stackone
  version: "1.0"
---

# StackOne Access Policies

A policy is a Cedar rule that allows or refuses MCP tool calls, scoped to a subject: a specific person, an AI client (claude, chatgpt, cursor), an account, or everyone. A policy's tool target id is `<connector key>_<action id>`, built from the `key` and action `id` that `stackone_list_connector_actions` returns. `tool` is a valid policy scope.

Follow these steps in order. Do not save a policy until step 5 passes.

## Step 1: Pin the scope before writing anything

Fix two things exactly, and do not start until both are clear:

- **Subject**: which person, which AI client, which account, or everyone.
- **Action set**: the exact actions the policy covers.

When the user describes the scope in words ("all deletes", "destructive actions", "writes to this system"), translate that phrase into a concrete, complete set of actions, then state your interpretation back to the user and get agreement before saving. Do not silently pick a set narrower or wider than the user meant. A phrase like "destructive" can mean delete alone, or delete plus write: ask which.

## Step 2: Enumerate the in-scope actions by effect, from the complete catalogue

Call `stackone_list_connector_actions` with the `effect` filter to list every action of that effect. This enumerator is authoritative: with `effect` set it returns every matching action and does not truncate.

- **Select by effect, never by name.** An action's effect can be delete even when its name contains no word like "delete". Choose actions by their `effect` (and `category` where the scope is category-bound), not by matching text in the label or id.
- **Do not use `stackone_list_connector_tools` to decide coverage.** It caps at 50 results, sets `truncated: true`, and has no effect filter, so on any connector with more than about 50 actions it silently omits some. It is fine for grabbing a ready-made target id, not for deciding what is in scope.
- **Build each target id** as `<connector key>_<action id>` from the `list_connector_actions` response.
- **Never write from an incomplete list.** If any listing you rely on comes back truncated, page or re-query until you hold the full set.

## Step 3: Write one policy per scope

When the scope is one coherent thing (one effect for one subject on one connector), express the whole intent in a single policy rather than scattering it across several. Get the Cedar syntax right for the subject, including clients, which are named like `StackOne::Client::"chatgpt"`.

## Step 4: Verify by count, not by sample

The `list_connector_actions` response carries an `actions_count` for the effect and scope you filtered on. Compare the number of actions your policy covers against that count. Coverage is complete only when the two match. A spot check of a few actions does not prove coverage.

## Step 5: Test before claiming it works

Run the draft or saved policy through `stackone_evaluate_policy` before you tell the user it is in place. This tests a pretend call (a tool, subject, and args) and returns allow or deny without touching real data.

- Test a representative of every group the policy should refuse, and at least one action it should still allow. One sample is not a test.
- If you cannot test the policy fully, say so plainly and call it untested. Never state that a policy works when you have not tested it.

## Step 6: Report coverage honestly

Tell the user what the policy covers and what it does not:

- **Covers**: the count of actions in scope, stated against the enumerated set from step 2.
- **Does not cover**: actions outside the effect filter, calls made with an API key if those bypass the policy, and any other profiles or accounts you did not touch.

Do not claim a policy "blocks everything" without the count from step 4 and the test from step 5 behind it.
