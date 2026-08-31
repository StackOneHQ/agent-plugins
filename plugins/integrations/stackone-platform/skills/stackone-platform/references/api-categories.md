# StackOne API

StackOne exposes two API surfaces:

## Actions API (primary)

The Actions API provides access to 30,000+ provider-specific actions across hundreds of connectors. Actions are executed via a single endpoint:

```
POST https://api.stackone.com/actions/rpc
```

Actions are named `{provider}_{operation}_{entity}` (e.g., `bamboohr_list_employees`, `salesforce_get_contact`).

For the full Actions API reference, fetch:
`https://docs.stackone.com/platform/api-reference/actions/make-an-rpc-call-to-an-action`

To discover available actions for a provider, fetch:
`https://docs.stackone.com/connectors/introduction`

## Platform API

The Platform API handles account management, not data operations:

| Endpoint | Purpose |
|----------|---------|
| `GET /accounts` | List linked accounts |
| `GET /accounts/{id}` | Get a specific linked account |
| `POST /connect_sessions` | Create a connect session for account linking |

For the full Platform API reference, fetch:
`https://docs.stackone.com/platform/api-reference/accounts/list-accounts`

## Connector Categories

Connectors are organized into categories. Fetch the category introduction pages for details on available providers:

| Category | Documentation |
|----------|--------------|
| HRIS | https://docs.stackone.com/hris/introduction |
| ATS | https://docs.stackone.com/ats/introduction |
| CRM | https://docs.stackone.com/crm/introduction |
| LMS | https://docs.stackone.com/lms/introduction |
| IAM | https://docs.stackone.com/iam/introduction |
| Documents | https://docs.stackone.com/documents/introduction |
| Accounting | https://docs.stackone.com/accounting/introduction |
| Ticketing | https://docs.stackone.com/ticketing/introduction |
| Messaging | https://docs.stackone.com/messaging/introduction |

## Authentication

All API calls require:
- `Authorization: Basic base64(api_key:)` header
- `x-account-id: {account_id}` header (for Actions API and data operations)
