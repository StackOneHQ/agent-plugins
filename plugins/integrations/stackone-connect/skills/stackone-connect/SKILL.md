---
name: stackone-connect
description: Implement account linking using StackOne Connect Sessions and the StackOne Hub. Use when user asks to "connect a provider", "embed the integration picker", "add BambooHR to my app", "create a connect session", "set up auth links", or "handle account webhooks". Covers the full flow from session creation to webhook handling. Do NOT use for making API calls after linking (use stackone-platform) or building AI agents (use stackone-agents).
license: MIT
compatibility: Requires network access to fetch live documentation from docs.stackone.com
metadata:
  author: stackone
  version: "2.1"
---

# StackOne Connect — Account Linking

## Important

Before writing code, fetch the latest documentation:
1. Fetch `https://docs.stackone.com/embed/account-linking/overview.md` for the current linking flow and the ways to embed the Hub
2. Fetch `https://docs.stackone.com/embed/account-linking/stackone-hub.md` for the current `<StackOneHub>` props and theming

The Hub component changes between versions. Take props, peer dependencies and link expiry from the docs, not from this skill.

When fetching a `docs.stackone.com` page whose URL doesn't already end in `.md`, append `.md` to get it as markdown. `llms.txt` is already plain text, so fetch it as is.

**If any URL in this skill returns 404, or a page doesn't cover what you need** (StackOne reorganizes its docs from time to time):
- Fetch `https://docs.stackone.com/llms.txt`, which indexes every docs page by title and description. Search the "Embed" section for the page's topic (e.g. "Connect Session", "Account Linking", "Auth Link", "Handle Account Events") and use the URL listed there.
- For the Hub package itself, the repository README is the fallback: `https://raw.githubusercontent.com/StackOneHQ/hub/main/README.md`.

## Instructions

### Step 1: Choose a connection method

| Method | When to use |
|--------|-------------|
| **Embedded Hub** | In-app integration picker, users stay in your app. React apps use `@stackone/hub`; other frameworks use the `<stackone-hub>` web component |
| **Auth Link** | Email onboarding, sales-led onboarding or demos. A StackOne-hosted page with the Hub already embedded, no frontend work |
| **Dashboard** | Internal tools, or linking an account on a customer's behalf |

If unsure, recommend the Embedded Hub. It provides the best user experience.

The overview page compares the methods and links to each one's guide.

### Step 2: Create a Connect Session (backend)

Your backend creates a session token that the frontend uses to initialize the Hub. Fetch `https://docs.stackone.com/embed/connect-session.md` for the required fields, filtering and connector profile targeting.

```bash
curl -X POST https://api.stackone.com/connect_sessions \
  -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "origin_owner_id": "customer-123",
    "origin_owner_name": "Acme Inc"
  }'
```

The response includes a `token` field. Pass this to the frontend.

Always set `origin_owner_id` on the server. Never take it from a client request, or one customer could claim another customer's linked accounts.

To control which providers appear in the Hub, pass `provider` (opens that connector directly) or `categories` (e.g. `["hris"]`). The Connect Session page also covers `account_id`, `multiple` and `connector_profile_id`.

Fetch `https://docs.stackone.com/platform/api-reference/connect-sessions/create-connect-session.md` for the full request/response schema.

### Step 3: Initialize the Hub (frontend)

For React, fetch `https://docs.stackone.com/embed/account-linking/stackone-hub.md` and follow its quick start:

```bash
npm install @stackone/hub
```

```tsx
import { StackOneHub } from "@stackone/hub";
import { useEffect, useState } from "react";

function ConnectorPage() {
  const [token, setToken] = useState<string>();

  useEffect(() => {
    fetchConnectSessionToken().then(setToken);
  }, []);

  if (!token) return <div>Loading...</div>;

  return (
    <StackOneHub
      token={token}
      onSuccess={(account) => {
        // Store account.id — you'll need it for all subsequent API calls
        console.log("Connected:", account.id, account.provider);
      }}
      onCancel={() => console.log("User cancelled")}
      onClose={() => console.log("Hub closed")}
    />
  );
}
```

For the full props list and theming options, use the Properties and Theming sections of that page.

For other frameworks, fetch `https://docs.stackone.com/embed/account-linking/stackone-hub-web-component.md`.

For an Auth Link instead of an embedded Hub, fetch `https://docs.stackone.com/embed/account-linking/auth-link.md`. It covers generating the link from the dashboard or from the Connect Session response, and setting its expiry.

### Step 4: Set up webhook listeners

Webhooks are required for Auth Links (no frontend callbacks) and recommended for the Embedded Hub:

| Event | When it fires |
|-------|---------------|
| `account.created` | New account linked |
| `account.updated` | Account changed, e.g. credentials refreshed |
| `account.deleted` | Account disconnected |

Fetch `https://docs.stackone.com/embed/handle-account-events.md` for subscribing to these events, verifying the signature and handling the payload. For webhook management in general (retries, secret rotation), fetch `https://docs.stackone.com/connect/webhooks.md`.

### Step 5: Verify the connection

After receiving `onSuccess` or the `account.created` webhook, fetch the account and check its `status`. Fetch `https://docs.stackone.com/platform/api-reference/v2/accounts/get-an-account.md` for the endpoint and the status values.

An `active` status confirms the connection is working.

## Examples

### Example 1: User wants to add an integration picker to a React app

User says: "I want to let my customers connect their BambooHR account"

Actions:
1. Fetch the Connect Session and StackOne Hub (React) pages
2. Create a backend endpoint that calls `POST /connect_sessions` with `provider: "bamboohr"`
3. Return the session token to the frontend
4. Install `@stackone/hub` and render `<StackOneHub token={token} />`
5. Handle `onSuccess` to store the account ID
6. Set up a webhook endpoint for `account.created` as a backup

Result: Working integration picker that opens straight to BambooHR.

### Example 2: User wants to send connection links via email

User says: "I need to onboard customers by email, not in-app"

Actions:
1. Fetch the Auth Link page
2. Create a Connect Session with `origin_owner_id` set to the customer, and the expiry the page describes
3. Read the auth link URL from the response, as the page describes
4. Set up webhook listeners — auth links have no frontend callbacks
5. Send the link via email

Result: Customer clicks link, authenticates, webhook fires with account details.

## Troubleshooting

### Hub component doesn't render
**Cause**: Missing or mismatched peer dependencies.
- Check the peer dependencies of the installed `@stackone/hub` version with `npm view @stackone/hub peerDependencies`
- For "Invalid hook call" errors, check for a duplicate React copy. The Hub README has a section on it
- Verify the session token is valid and not expired

### Connect Session token expired
**Cause**: Tokens are short-lived.
- Generate a new token for each Hub initialization
- Do not cache tokens across sessions

### onSuccess fires but account status is "error"
**Cause**: Provider-side authentication succeeded but StackOne couldn't sync data.
- Check the account's `status_reasons`, or the account details in the dashboard, for the specific error
- Common cause: insufficient permissions on the provider side
- The provider may require additional OAuth scopes

### Webhooks not arriving
**Cause**: Webhook endpoint configuration issue.
- Verify the endpoint URL is publicly accessible (not localhost)
- Check the account events are selected on the webhook itself, not on a connector profile
- Check the webhook signing secret matches
- Fetch `https://docs.stackone.com/embed/handle-account-events.md` for the verification process
