# Integration Method Decision Guide

Use this guide to choose the right StackOne integration method.

## Decision Tree

```
Are you writing code for a custom agent?
├── YES → What language?
│   ├── TypeScript/JavaScript → Use @stackone/ai (TypeScript SDK)
│   │   ├── OpenAI Chat Completions → tools.toOpenAI()
│   │   ├── OpenAI Responses API → tools.toOpenAIResponses()
│   │   ├── Anthropic Claude → tools.toAnthropic()
│   │   ├── Vercel AI SDK → await tools.toAISDK()
│   │   └── Claude Agent SDK → await tools.toClaudeAgentSdk()
│   ├── Python → Use stackone-ai (Python SDK)
│   │   ├── OpenAI → tools.to_openai()
│   │   ├── LangChain → tools.to_langchain()
│   │   ├── LangGraph → tools.to_langchain() + ToolNode
│   │   ├── CrewAI → tools.to_langchain()
│   │   └── PydanticAI → tools.to_pydantic_ai()
│   └── Other framework, or prefer a standard MCP client → Use MCP Server
│       (https://api.stackone.com/mcp, API key + x-account-id)
│       └── Fetch docs.stackone.com/embed/call-actions/mcp.md and follow the framework guide link
├── NO → Are you using StackOne from an existing AI app (Claude Code, Cursor, ChatGPT, ...)?
│   ├── YES → Connect with a session token URL (https://api.stackone.com/mcp?token={session_token})
│   │   └── Fetch docs.stackone.com/connect/ai-platforms/overview.md and follow the app guide link
│   └── NO → Agent-to-agent communication?
│       └── YES → Use A2A Protocol
│           └── Fetch docs.stackone.com/embed/call-actions/agent2agent.md and follow the framework/platform guide link
```

## Framework Conversion Methods (TypeScript SDK)

| Framework | Method | Async? |
|-----------|--------|--------|
| OpenAI Chat Completions | `tools.toOpenAI()` | No |
| OpenAI Responses API | `tools.toOpenAIResponses()` | No |
| Anthropic Claude | `tools.toAnthropic()` | No |
| Vercel AI SDK | `await tools.toAISDK()` | Yes |
| Claude Agent SDK | `await tools.toClaudeAgentSdk()` | Yes |

## Framework Conversion Methods (Python SDK)

| Framework | Method |
|-----------|--------|
| OpenAI | `tools.to_openai()` |
| LangChain | `tools.to_langchain()` |
| LangGraph | `tools.to_langchain()` (wrap in a `ToolNode`) |
| CrewAI | `tools.to_langchain()` (CrewAI accepts LangChain tools) |
| PydanticAI | `tools.to_pydantic_ai()` |

## Key Documentation URLs

Each overview page below links to its individual guides, so fetch the overview and follow the relevant link rather than guessing guide URLs. Append `.md` to any docs.stackone.com page to get markdown. If any docs.stackone.com URL here returns 404, or an overview page doesn't link the guide you need, fetch `https://docs.stackone.com/llms.txt` (it indexes every page by title and description), search it for the page's topic (e.g. "MCP", "AI Platforms", "Agent2Agent") and use the URL listed there.

- TypeScript SDK README: `https://raw.githubusercontent.com/stackoneHQ/stackone-ai-node/refs/heads/main/README.md`
- Python SDK README: `https://raw.githubusercontent.com/stackoneHQ/stackone-ai-python/refs/heads/main/README.md`
- MCP overview: `https://docs.stackone.com/embed/call-actions/mcp`
- MCP troubleshooting: `https://docs.stackone.com/embed/call-actions/mcp/troubleshooting`
- AI platforms (MCP clients): `https://docs.stackone.com/connect/ai-platforms/overview`
- A2A overview: `https://docs.stackone.com/embed/call-actions/agent2agent`
- All docs: `https://docs.stackone.com/llms.txt`
