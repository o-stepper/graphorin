---
'@graphorin/tools': minor
'@graphorin/workflow': minor
'@graphorin/agent': minor
'@graphorin/sessions': minor
---

Error-hierarchy corrections backing the new error-contract documentation: `ToolRateLimitError` now extends `GraphorinToolsError` (kind `'rate-limited'`) and `TimerDriverStoreUnsupportedError` now extends `WorkflowError` (new `'timer-driver-store-unsupported'` code in the union) - both were direct `Error` subclasses, invisible to catch sites filtering on the package bases. `AgentRuntimeError` and `SessionError` constructors accept a trailing `{ cause }` option so wrapped failures thread their root cause like every other package base.
