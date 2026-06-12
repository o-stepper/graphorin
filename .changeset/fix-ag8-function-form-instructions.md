---
'@graphorin/agent': patch
---

fix(agent): resolve the function form of `instructions` instead of silently dropping it (AG-8)

`AgentConfig.instructions` is typed (and documented) as
`string | ((ctx) => string | Promise<string>)`, but the run loop only handled
the string case — a function-form `instructions` was silently discarded and the
agent ran with **no system message at all**. Since the system prompt frequently
carries policy / guardrail text, this was a security-adjacent loss with no error.

The loop now resolves the function form (sync or async, awaited) once per run
against a `RunContext` snapshot at step 0, and pins the result as the run's
system-prompt prefix. The per-run contract is documented on the field's JSDoc.
Tests cover the sync and async forms producing the system message in the first
provider request.
