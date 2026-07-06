---
'@graphorin/client': patch
---

W-108: when a `transport: 'auto'` client reconnects and falls back from WebSocket to SSE, surviving WS subscriptions are now closed with a typed `TransportFailedError` instead of hanging their `for await` consumers forever. SSE carries exactly one bound-session subject, so agent/workflow subscriptions are fundamentally unresumable over it - the deterministic error (with a recovery hint: force `transport: 'ws'` or read the bound session subject) hands the decision to the application; an endless WS retry would wedge against servers with WS disabled. The bound `'__sse__'` subscription is untouched, so the SSE-first resume path (periphery-03) is unchanged. The `transport` option TSDoc documents the behaviour.
