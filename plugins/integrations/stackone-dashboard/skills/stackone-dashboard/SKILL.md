---
name: stackone-dashboard
description: Administer StackOne in the dashboard (app.stackone.com): connector profiles, linked-account statuses, roles and groups, account sharing, tool policies, logs, webhooks and data sync. Use when a signed-in user asks what a dashboard concept means or where to find it. Triggers include "what is a connector profile", "why is my linked account in error", "how do roles and groups work", "how do I share a linked account", "enforce vs monitor policy", "request logs vs advanced logs", "how do webhooks work", "what is data sync". Not for API calls and keys (use stackone-platform), embedding account linking (use stackone-connect), finding actions/connectors (use stackone-connectors), or building agents (use stackone-agents).
license: MIT
compatibility: Requires network access to fetch live documentation from docs.stackone.com
metadata:
  author: stackone
  version: "1.0"
---

# StackOne Product: Managing Your Integrations

StackOne is integration infrastructure that lets AI agents and apps act in third-party providers (HR, CRM, ATS, finance, collaboration tools and hundreds more). The StackOne **dashboard** at `app.stackone.com` is where a signed-in user configures what agents use (connectors, API keys and webhooks) and monitors their activity. This skill explains the concepts a dashboard user acts on and where each one lives. It is deliberately broad, not exhaustive: for any detail, fetch the live docs.

## Important: fetch the latest docs first

The dashboard and its docs change. Before answering anything beyond the concepts below, fetch the current page:

1. Fetch `https://docs.stackone.com/llms.txt` to discover every doc page by title.
2. Fetch the specific page for the user's topic. When a `docs.stackone.com` URL does not already end in `.md`, append `.md` to get raw markdown. `llms.txt` is already plain text, fetch it as is.

Do not guess or rely on possibly stale text in this skill. If a URL here 404s or a page does not cover what you need (StackOne reorganizes its docs), search `llms.txt` for the topic and use the URL listed there. If the docs do not cover the question, say so and suggest contacting StackOne support. Do not invent an answer. The public docs do not define plan tiers, seat limits, project limits, or a full list of plan-gated features; do not invent them.

The core concepts (organization, project, connector, connector profile, linked account) are defined at `https://docs.stackone.com/gateway/concepts/overview.md`.

## How the account is structured

Access and configuration mirror one hierarchy: an **organization** contains **projects**, and each project contains **connector profiles** and **linked accounts**. The project selector sits at the top of the dashboard sidebar and switches between projects; the one in use is tagged **Current**, and each project shows the region it runs in. The organization menu opens team and security settings. `Cmd/Ctrl+K` opens a command palette scoped with `@` (linked accounts), `#` (connectors), `/` (connector profiles) and `>` (pages and actions); it only shows pages and actions your role allows.

Docs: `https://docs.stackone.com/gateway/dashboard.md`

## Connector profiles

**Concept.** A connector profile holds the configuration for one connector within a project. It decides how your users connect to a provider and what your agents can do with the accounts linked through it. One profile bundles: **Actions** (which actions its linked accounts can call), **Events** (which events they can send), **Accounts** (the linked accounts under it), **Access** (who may use it), and **Logs** (activity per account).

**When it matters.** Run more than one profile for the same connector when you need two authentication methods (for example an API-key profile and an OAuth profile), different action or event scopes (read-only versus write-enabled), or a staging profile pinned to a new connector version for testing.

**Creating one.** On a connector's page, select **Add Profile** and follow the setup steps. A profile created by a Project Member starts with account linking disabled; a Project Admin or Organization Admin must turn it on with **Enable Account Linking**. The authentication type cannot be changed after a profile is created, so create a new profile to switch it. A profile can be deleted only when it has no linked accounts.

**Default profile.** Each connector has exactly one default profile, used when a user links an account without being sent to a specific profile. Only Project Admins and Organization Admins can change which profile is the default.

**Version pinning.** A profile's **Update strategy** controls which connector versions it moves to, so you can pin a profile to a version (for example keep production on one major version while a staging profile tests the next) and keep its behaviour fixed.

**Restricting who can use it.** A profile is either shared with everyone in the project or restricted to chosen members and groups, through **Connector Profile Access**. A restricted profile stays hidden from users who are not permitted to use it, including during linking.

**Where it lives.** Dashboard → **Connectors** → select a connector. Profiles appear as cards along the top, with Actions, Events, Accounts, Access and Logs tabs below.

Docs: `https://docs.stackone.com/connect/managing-connectors/connector-profiles.md`, `https://docs.stackone.com/secure/identity-and-access/roles-and-groups/connector-profile-access.md`

## Linked accounts

**Concept.** A linked account is one authenticated connection to a provider, created through a connector profile. Once it exists, agents can run that profile's actions on it and its events flow to your webhooks.

**Linking.** StackOne offers several linking routes (Embedded Hub, Auth Link, Dashboard); for how they differ and how to embed them, use the stackone-connect skill. In the dashboard a signed-in user links an account manually: start linking → name the account → connect (enter credentials, authorize via OAuth if required) → the account appears under the Accounts tab. Only profiles you are allowed to use appear in the picker.

**Statuses.** A linked account is one of:

- **Active**: credentials are valid and the account is serving calls.
- **Suspended**: manually paused, so no actions run against it; credentials stay saved.
- **Error**: calls are failing, usually from expired credentials or revoked provider access.

Subscribe to the `account.updated` and `account.deleted` webhook events to react to status changes.

**Reconnect vs enable.** **Reconnect** updates expired credentials on the existing account instead of creating a second one (use it for an account in Error). **Enable** resumes a Suspended account. These are different operations: reconnect fixes bad credentials, enable un-pauses a working account.

**Suspension.** Organization Admins, Project Admins and Account Admins can suspend an account. An Account Member who was only shared into an account (run actions only) cannot suspend it, but whoever links an account becomes its Account Admin, so a project member can re-enable or reconnect an account they linked. A suspended account cannot call actions but keeps its credentials for later resumption without re-authenticating.

**Where it lives.** Dashboard → **Accounts** to view, reconnect, suspend, enable or remove accounts; also the per-profile **Accounts** tab under Connectors.

Docs: `https://docs.stackone.com/connect/managing-connectors/linking-accounts.md`

## Members, groups and roles

**Concept.** A user's effective role on any resource is the strongest role they hold there. Roles exist at four levels:

- **Organization**: Organization Admin (runs the whole organization) and Organization Member.
- **Project**: Project Admin (full control of a project), Project Member (can link accounts; reaches only accounts they linked or were granted), Project Viewer (read-only on the project's accounts, cannot run actions).
- **Connector profile**: Connector Profile Member (may link accounts through a restricted profile).
- **Account**: Account Admin (run actions, edit, delete, reconnect, and manage who else has access) and Account Member (run actions only). Whoever links an account becomes its Account Admin.

**Direct and group roles combine by strength.** When a user's direct role and a role from a group they belong to differ, the stronger one wins (a Project Viewer who is also in a Project Admin group is effectively a Project Admin). Groups apply the same roles to many people at once, edited in one place.

**Inherited reach.** Organization Admins reach every account in the organization; Project Admins reach every account under their project; Project Viewers can view every account under the project but not run actions; Project Members reach only accounts they linked or were granted.

**Who can invite users.** Only Organization Admins can invite users. Invites go out by email (several addresses at once, comma-separated) from **Organization → Manage Team → Invite User**; pending invites wait on the **Invites** tab. An invite sets a required Organization Role (Admin or Member) and an optional Project Role; people can also be added to projects later under **Project Settings → Access**, where you can also check effective roles.

Docs: `https://docs.stackone.com/secure/identity-and-access/roles-and-groups/overview.md`, `https://docs.stackone.com/secure/identity-and-access/manage-team/invite-users.md`, `https://docs.stackone.com/secure/identity-and-access/roles-and-groups/groups.md`

## Sharing a linked account

**Concept.** Sharing lets several people operate through a single login instead of each connecting their own. Nothing new is created; users gain access to the existing connection and act with the account owner's credentials.

**Who may share.** You must hold Account Admin on the account, and the person you add must already be in the account's project or be an Organization Admin. On a shared account, Account Admin can run actions, edit, delete, reconnect and manage access, while Account Member can run actions only.

**Connector Profile Access vs Shared Accounts.** These answer different questions. Connector Profile Access controls *who may connect* a new account (each user links their own, with their own credentials). Shared Accounts controls *who may use an existing connection* (no new account, everyone acts through the owner's credentials).

**Where it lives.** Dashboard → **Accounts** → select the account → **Access** tab → **Add Users** (or a group), choosing Account Admin or Account Member.

Docs: `https://docs.stackone.com/secure/identity-and-access/roles-and-groups/shared-accounts.md`

## Tool policies

**Concept.** Policies govern which tools an agent may use on a member's behalf, which fields are visible, and what data flows in and out of each call. StackOne checks applicable policies before a call reaches the provider.

**What they govern, and what they do not.** A policy attaches to a known member identity. That is the case both for a signed-in AI client (an MCP client the user authorized) and for calls a signed-in dashboard user makes from the in-dashboard playground, so policies govern both. A call made with a project API key (a direct API call) names no member, so no policy governs it; scope that traffic with connector profiles instead. You can further narrow a policy to specific AI clients (for example ChatGPT, Claude, Cursor) with **From clients**, or leave it on any client.

**Modes.** **Enforced** refuses a call the policy denies before anything reaches the provider, and the calling agent receives an error or denial explaining it; it also masks fields and redacts data per the rule. The denial reaches the agent as a tool error or refusal with its reason, not as one fixed HTTP status: the status is route-dependent, and a call made through the StackOne MCP comes back as a tool error in the response envelope rather than necessarily an HTTP 403. **Monitored** records decisions in the logs without blocking or changing calls. **Disabled** stores the policy without evaluating it. A common workflow is to start a deny rule Monitored, confirm its effect in the logs, then switch it to Enforced.

**How they are defined.** Each policy carries one rule with four parts: who it applies to (Everyone, Users, Groups), what it does (Allow or Deny), the capability (use a tool, read a field, write a field, value rule, redact PII, semantic rule), and what it applies to (everything, a connector category, a connector, an account or specific tools). Guarantees: a deny always wins, policies only narrow access, a policy follows the member, and a policy stays within its project. The engine evaluates rules in **Cedar**; review a policy as Plain Text, Cedar (the exact statement the engine evaluates, read-only) or JSON. Do not reproduce Cedar grammar from memory; the policies doc is the source.

**Where it lives.** Dashboard → **Project Settings → Policies**. Create with **Create policy** (optionally the Policy AI Assistant), or start from a log row in StackOne Logs via **Use in policy**.

Docs: `https://docs.stackone.com/secure/policies.md`

## Request logs and advanced logs

**Concept.** StackOne records a request log for every call it handles for you (RPC action runs, MCP tool calls, and the connector steps behind them).

**Request logs vs advanced logs.** Request (standard) logs carry metadata only: status, duration, connector, account, action and step summaries. **Advanced logs** carry the full HTTP request and response bodies, per request or per step. Advanced logs are fetched on demand, not for every row; their retention and an error-only mode are set per project in the dashboard.

**Diagnosing a failed call.** Filter the log list to failures to get the request, open its detail for the metadata, list its execution steps to find the failing step, then open that step's advanced log to read the request and response bodies. Common filters mirror the dashboard search: account, connector or provider, time range, success or status code, and action. When Defender is enabled for the project, a per-call Defender log shows the scan of an AI agent's tool calls. The dashboard also offers an AI Error Explainer with suggested resolution steps.

**Where it lives.** Dashboard → the **Request Logs** page (under Connect → Troubleshooting). This covers request logs, not platform or audit logs.

Docs: `https://docs.stackone.com/features/observability/request-log-debugging.md`, `https://docs.stackone.com/connect/troubleshooting.md`

## Webhooks and signing secrets

**Concept.** A webhook is an HTTPS endpoint StackOne delivers to; an event is the payload. You create a webhook, enable events on a connector profile, and subscribe the webhook to those events. You need both: enabling an event without routing it sends nothing, and routing without enabling means nothing arrives. Events come from connectors (programmatic, manual/"requires setup", or data-sync-derived) and from the platform (account lifecycle, such as connect and disconnect).

**Signing secrets.** Deliveries are signed so your endpoint can verify them. A project holds up to two signing secrets with only one active at a time, which lets you rotate: generate a new (inactive) secret, accept either secret in your endpoint, activate the new one (the old one goes inactive), then delete the old one once verified. A deleted secret cannot be retrieved or reactivated. For how to verify a signature in code, use the stackone-connect skill (its handle-account-events.md).

**Managing.** Disable stops delivery while subscriptions keep flowing events into StackOne; enable resumes; delete is irreversible and cleans up unused subscriptions.

**Where it lives.** Dashboard → **Webhooks** page (the endpoint, signing secrets, delivery health). Events are enabled on the connector profile's **Events** tab (or Data Sync panel).

Docs: `https://docs.stackone.com/connect/webhooks.md`

## Data sync

**Concept.** Data Sync polls provider APIs on a schedule you set and stores the records in StackOne's indexes, so you can search and aggregate them without calling the provider each time. You configure it once per action on a connector profile, and every account on that profile is synced automatically, including accounts linked later. A sync run can optionally send an event to a webhook when it adds, updates or removes a record.

**Where it lives.** Dashboard → **Connectors** → a profile's **Actions** tab (the sync icon) to configure; **Accounts** → open an account → **Data Sync** tab to monitor cadence and runs.

Docs: `https://docs.stackone.com/optimize/data-sync/overview.md`

## Plans and limits

Plan-dependent limits exist and StackOne enforces them at runtime: a call that exceeds a limit is refused, so an agent learns a specific limit from the refusal rather than from a published figure. Point a user who needs their plan's figures to StackOne.

Docs: `https://docs.stackone.com/platform-api/rate-limiting.md`
