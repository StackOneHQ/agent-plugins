---
name: stackone-connection
description: Use when the user wants to connect or link an account, reconnect a broken or expired connector, choose between a connector's profiles before linking, or verify that a newly linked account works. Covers linking, reconnection, profile choice, and link diagnosis. Not for running a provider action on an already-working account.
license: MIT
metadata:
  author: stackone
  version: "1.0"
---

# Connecting and setting up accounts

Linking an account, repairing a broken one, picking the right connector profile, and confirming a
new link all change account state. Each writes with the signed-in user's own permissions, so read
the current state first, make the one change that is needed, and make no write when the state you
want already holds.

## Read before you write

Find the thing before you touch it, and stop if it is already right.

- A profile: `stackone_list_connector_profiles {connector_key: ["<provider>"]}` or `stackone_get_connector_profile {id}`. `connector_key` is a list.
- An account: `stackone_list_linked_accounts {providers}` or `stackone_get_account {id}`.

If the account is already linked and authenticated, or the profile already enables the action, say
so and change nothing.

## Pick the profile deliberately

A connector can have several profiles (for example a production and a sandbox one), and each links
through different credentials and enables different actions.

- List them with `stackone_list_connector_profiles {connector_key: ["<provider>"]}`. If more than one is active,
  tell the user how they differ (name, environment, enabled action count) or ask what they need
  before linking.
- Start the link with the chosen profile's `id`, passed as `connector_profile_id`. A bare
  `provider` binds to the connector's default profile and makes the choice silently, so pass
  `connector_profile_id` whenever more than one profile fits.

```
stackone_link_account { connector_profile_id: "<the profile's id>", label: "Prod CRM" }
```

## Linking is one step

`stackone_link_account` returns the auth link synchronously, but the account exists only after the
user finishes in the browser. There is no status-poll tool.

1. `stackone_link_account { connector_profile_id | provider }` returns
   `{ auth_link_url, expires_at, provider, connector_profile_id, next_steps }`. Give the user the
   `auth_link_url` to open and relay `next_steps`.
2. When the user says they are done, confirm the account exists with a read:
   `stackone_list_linked_accounts` or `stackone_get_account` returns the new account. Confirm
   success from that read, never from the fact that you started the link.

## Reconnect a broken account; do not replace it

`stackone_link_account` has no `account_id` input, and this surface has no separate repair or
edit-mode tool. You reconnect an expired or deauthorized account by starting a fresh link through
the same connector profile the account already uses, then confirming by re-reading the account.

- Read the broken account with `stackone_get_account {id}`. Its output names the provider and the
  profile (`integration_config_labels`), but not the profile id.
- Look the profile up with `stackone_list_connector_profiles {connector_key: ["<the account's
  provider>"]}` and match it by name to get its `id`.
- Relink through that profile:

```
stackone_link_account { connector_profile_id: "<the broken account's profile id>" }
```

Do not delete the old account first, and do not start a bare `provider` link when more than one
profile exists for the connector. Confirm the repair by re-reading the account and checking its
status.

## Diagnose a new or suspect link from evidence

When a link looks wrong, run the actual reads and report which work and which fail, rather than
guessing.

- Find the account's read actions and run one: `stackone_search_actions`, then
  `stackone_execute_action { action_id, stackone_account_id }`. Use a read action to test a read;
  never run a write or delete to probe.
- If the account authenticates but one read fails, the link is working and the gap is a
  provider-side permission. Quote the provider's own error and recommend the minimal fix (for
  example granting a view-level scope), not reconnecting, relinking, or replacing the account.
- Recommend reconnecting only when the evidence shows the account itself is not authenticated.

## No collateral writes

Stay inside what the user asked. Do not delete accounts, change a profile's actions, suspend or
re-enable accounts, message anyone other than the user, or run any write or delete action to test a
read. When a step would change state the user did not ask about, stop and ask first.

## Finish

Tell the user the state that now holds and how you confirmed it: the account that is linked and its
status from the read-back, and the profile it linked through. If an action remains with the user
(opening the auth URL, granting a provider-side permission), say what it is. Report what you did not
do when you chose not to.
