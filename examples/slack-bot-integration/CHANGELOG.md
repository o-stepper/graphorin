# `@graphorin/example-slack-bot-integration`

## 0.1.0

Initial release. Ships the Slack bot integration acceptance demo: a
`createSlackBotApp({...})` factory wires the framework's six-tier
memory stack, the SQLite-backed agent runtime, the bearer-token-auth-
capable `GraphorinServer`, and a bridge layer that converts inbound
Slack webhook events into `agent.stream(...)` runs and mirrors the
streamed assistant reply back via `chat.postMessage`. The headline
`simulateApprovalLifecycle({...})` helper exercises the durable HITL
flow end-to-end (high-amount expense pauses the agent on
`tool.approval.requested`, the SQLite `CheckpointStore` survives a
simulated `pkill graphorin && restart`, an operator approve/deny
decision resumes the run via
`agent.run(savedState, { directive: { approvals: [...] } })`). The
smoke test stubs `@slack/web-api` and the LLM provider so CI never
touches the network and finishes in well under 30 s.
