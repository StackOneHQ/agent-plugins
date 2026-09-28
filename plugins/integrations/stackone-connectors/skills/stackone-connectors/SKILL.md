---
name: stackone-connectors
description: Discover StackOne's connectors and 30,000+ actions across HR, Sales, Marketing, IT, finance and collaboration tools (Workday, SAP, Oracle, Salesforce, Google, Microsoft and hundreds more). Use when user asks "which providers does StackOne support", "what can I do with BambooHR", "recommend an integration for HR", "what actions are available", "how do I call a provider-specific action", or "does StackOne support Workday". Helps choose the right connector and actions for any use case. Do NOT use for building agents (use stackone-agents) or connecting accounts (use stackone-connect).
license: MIT
compatibility: Requires network access to fetch live documentation from docs.stackone.com
metadata:
  author: stackone
  version: "2.1"
---

# StackOne Connectors — Integration Discovery

## Important

Connector availability changes frequently as StackOne adds new providers. Before answering:
1. Fetch `https://docs.stackone.com/connectors/introduction.md` for the current connector list. Each entry carries the connector's `key`, name, categories, action count and release stage
2. For a specific provider, fetch its StackOne connector page (e.g. `https://docs.stackone.com/connectors/workday/index.md`). It lists that connector's actions, authentication methods and setup guides

Never assume a connector exists or doesn't exist without checking live docs. The connectors list only confirms a connector exists. For its actions or authentication methods, read its StackOne connector page, not the provider's own API documentation.

When fetching any `docs.stackone.com` page, append `.md` to the URL to get it as markdown.

**If any URL in this skill returns 404, or a page doesn't cover what you need** (StackOne reorganizes its docs from time to time):
- Fetch `https://docs.stackone.com/llms.txt`, which indexes every docs page by title and description. Its "Connectors" section lists one page per connector by provider name, plus that connector's changelog and authentication guides. Use the URL listed there.
- If neither the connector page nor the index covers the question (for example, a provider-side setting, or an arrangement with the provider), say the docs don't cover it and suggest contacting StackOne support. Don't invent an answer.

## Instructions

### Step 1: Identify the user's integration need

Common patterns:
- **"What providers do you support for X?"** → Filter the connectors list by category
- **"Can I do Y with provider Z?"** → Fetch provider Z's connector page and check its actions
- **"Recommend an integration for my use case"** → Match the use case to a category, then list available providers
- **"Can I list connectors or actions from code?"** → Use the API (see Step 3)

### Step 2: Find the provider's connector page

Find the provider in the connectors list or in the "Connectors" section of `llms.txt` and use the page URL listed there. The connector key is not always the provider's everyday name (SAP ERP is listed as SAP S/4HANA, for example), so look the page up rather than building the URL from a guess.

Search by the provider's official name and by its parent company's name. A provider may be listed under a product name the user didn't use.

### Step 3: Check available actions for a provider

Read the Actions section of the provider's connector page. Action counts vary widely between providers, so take the list from the page rather than estimating it.

Actions are named `{provider}_{operation}_{entity}` (e.g., `bamboohr_list_employees`, `salesforce_get_contact`).

To list connectors and actions from code instead of the docs, for example to build a catalogue in the user's own product, use the Connectors API:

| Need | Reference page |
|------|----------------|
| Every connector available to the project | `https://docs.stackone.com/platform/api-reference/v2/connectors/list-connectors.md` |
| One connector's details, authentication methods and actions | `https://docs.stackone.com/platform/api-reference/v2/connectors/get-connector.md` |
| One action's inputs and result | `https://docs.stackone.com/platform/api-reference/v2/connectors/get-connector-action.md` |

### Step 4: Execute actions via the Actions API

All actions are executed through StackOne's Actions API:

```bash
curl -X POST https://api.stackone.com/actions/rpc \
  -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:' | base64)" \
  -H "x-account-id: ACCOUNT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "bamboohr_list_employees"
  }'
```

AI agents typically call actions via the SDK or MCP rather than raw API calls — see the `stackone-agents` skill for SDK/MCP integration.

Fetch `https://docs.stackone.com/embed/call-actions/rpc-http.md` for the calling guide, and `https://docs.stackone.com/platform/api-reference/actions/make-an-rpc-call-to-an-action.md` for the full RPC reference.

### Step 5: Test before building

- **Playground**: try actions in natural language before writing code. Fetch `https://docs.stackone.com/embed/call-actions/troubleshooting/playground.md`
- **MCP Inspector**: `npx @modelcontextprotocol/inspector https://api.stackone.com/mcp` — test via MCP. Add the `Authorization` and `x-account-id` headers in the Inspector UI before connecting (see `https://docs.stackone.com/embed/call-actions/mcp/troubleshooting.md`)
- **Postman**: importable collection available from the docs. Fetch `https://docs.stackone.com/embed/call-actions/troubleshooting/postman.md`

## Release stages

The connectors list and each connector page show a release stage when a connector isn't generally available.

| Stage | Meaning | Recommendation |
|-------|---------|----------------|
| **GA** | Production-ready, fully supported | Safe for production |
| **Beta** | Stable for testing, minor changes possible | OK for non-critical flows |
| **Preview** | Early-stage, expect breaking changes | Development/testing only |

## Examples

### Example 1: User wants to know what HR integrations are available

User says: "Which HRIS tools does StackOne support?"

Actions:
1. Fetch `https://docs.stackone.com/connectors/introduction.md`
2. Filter for the HRIS category
3. List available providers with their release stages
4. For specific providers the user is interested in, fetch their connector pages and list their actions

Result: Current list of HRIS connectors, with actions for the providers the user cares about.

### Example 2: User wants to know what they can do with a specific provider

User says: "What can I do with BambooHR through StackOne?"

Actions:
1. Find BambooHR's connector page in the connectors list or `llms.txt` and fetch it
2. List the available actions from the page (e.g., `bamboohr_list_employees`, `bamboohr_get_employee`, etc.)
3. Explain the Actions API for executing them, or recommend using the SDK/MCP for agent integration
4. Fetch the RPC/HTTP guide for payload details if they need the raw API

Result: Full list of BambooHR actions with how to call them.

### Example 3: User needs a connector that doesn't exist

User says: "Does StackOne support our custom HR tool?"

Actions:
1. Check the connectors list and `llms.txt`. It may exist under a different name
2. If not found, explain the two options from the "Add a New Connector or Action" section of the connectors page:
   a. Request it from StackOne
   b. Build it: fetch `https://docs.stackone.com/connector-building/overview.md` (see the `stackone-cli` skill)

Result: Clear path forward — either request or build.

## Troubleshooting

### Can't find a specific provider
**Cause**: Provider may be listed under a different name, or may not be supported yet.
- Search the connectors list by the provider's official name
- Check if it's under a parent company name (e.g., "Microsoft Entra ID" not "Azure AD")
- If not found, suggest requesting it or building a custom connector

### Action returns "not supported" for a provider
**Cause**: The requested action doesn't exist for this provider.
- Each provider has its own set of actions. Check the provider's connector page for what's available
- Action names include the provider prefix (e.g., `bamboohr_list_employees` not `list_employees`)
- Some actions require specific OAuth scopes on the provider side

### Connector logos not loading
**Cause**: Incorrect logo URL.
- Take the logo URL from the connector's `icon` field in the connectors list. The logo slug does not always match the connector key
