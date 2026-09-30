# StackOne API

StackOne exposes two API surfaces:

## Actions API (primary)

The Actions API provides access to 30,000+ provider-specific actions across hundreds of connectors. Actions are executed via a single endpoint:

```
POST https://api.stackone.com/actions/rpc
```

Actions are named `{provider}_{operation}_{entity}` (e.g., `bamboohr_list_employees`, `salesforce_get_contact`).

For the full Actions API reference, fetch:
`https://docs.stackone.com/platform/api-reference/actions/make-an-rpc-call-to-an-action.md`

To discover available actions for a provider, fetch:
`https://docs.stackone.com/connectors/introduction.md`

## Platform API

The Platform API handles account management, not data operations:

| Endpoint | Purpose |
|----------|---------|
| `GET /v2/accounts` | List linked accounts |
| `GET /v2/accounts/{id}` | Get a specific linked account |
| `POST /connect_sessions` | Create a connect session for account linking |

For the full Platform API reference, fetch:
`https://docs.stackone.com/platform/api-reference/v2/accounts/list-accounts.md`

The "Platform API" section of `https://docs.stackone.com/llms.txt` lists every reference page (Accounts, Actions, Connect Sessions, Connector Profiles, Connectors, Logs, Webhooks and more).

## Connector Categories

Connectors are organized into categories such as HRIS, ATS, CRM, LMS, IAM, Documents, Accounting and Ticketing. Fetch `https://docs.stackone.com/connectors/introduction.md`, which tags each connector with its categories, and filter by the category. Each connector's own page lists its actions.

## Authentication

All API calls require:
- `Authorization: Basic base64(api_key:)` header
- `x-account-id: {account_id}` header (for Actions API and data operations)
