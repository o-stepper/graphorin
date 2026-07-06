---
'@graphorin/mcp': patch
---

SDK error classification is code-based, not message-based (W-141): an `McpError`'s message is server-controlled text, so a server phrasing an ordinary failure as "request timed out" or "cancelled by user" could forge the typed `MCPCallTimeoutError`/`MCPCancelledError` classes and skew the operator counters keyed on them. Timeouts now map from `ErrorCode.RequestTimeout` (-32001), cancellation maps from the caller's own AbortSignal state (SDK 1.29 wraps local aborts in the same -32001 code, so the signal - not the error - is the trustworthy fact), and message heuristics remain only as a last resort for plain non-RPC errors plus the benign tool-not-found class. The advertised elicitation capability is now the explicit `{ form: {} }` sub-capability of the 2025-11-25 spec instead of the bare `{}` shorthand.
