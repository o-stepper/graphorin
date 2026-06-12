---
'@graphorin/agent': patch
---

fix(agent): execute approved tool calls on resume instead of a placeholder (AG-1)

Resuming a suspended run with a granted approval never ran the tool. The runtime
pushed a literal `"[approval granted; tool not actually executed in resume]"`
tool message and reported success — so the gated side effect (the audit's
refund/payments example) was unreachable, and the durable human-in-the-loop path
was entirely non-functional.

A granted approval now queues its call and, once **every** approval is resolved
(the run is `'running'`), the calls are dispatched through the shared
`ToolExecutor` — same taint / audit / result recording as any tool call —
**before** the provider loop, so the model sees their genuine results on the
first step. Each runs exactly once, recorded as a `CompletedToolCall` in a resume
step. Dispatching outside the loop's approval pre-screen also means the gated
call never re-suspends (no livelock). The placeholder string is removed from the
codebase. Test: a resumed `send_email` approval yields one `tool.execute.end`
carrying the tool's real `sent:a@b.c` result.
