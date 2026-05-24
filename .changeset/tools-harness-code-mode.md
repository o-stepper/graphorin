---
'@graphorin/security': minor
'@graphorin/tools': minor
'@graphorin/agent': minor
---

WI-11 / P1-2 — code-mode / programmatic tool calling (opt-in).

**Write code, not one-call-at-a-time.** A new agent config `toolInvocation: 'code-mode'`
(default `'direct'`, unchanged) advertises only two Graphorin-named meta-tools —
`code_execute` and `code_search` — and lets the model reach every real tool by
writing a script. `code_execute({ source })` runs the model-written JavaScript in a
sandbox; inside, `await tools.<name>(args)` calls the real tool. **Only the script's
`return` value re-enters the context window** — every intermediate result stays in the
sandbox — so a workflow that would otherwise inline many large tool results consumes
context for the final answer alone. `code_search({ query })` returns the exact call
signatures of tools on demand (progressive disclosure).

**Sandbox primitive (`@graphorin/security`).** New `runBridgedSource(...)` in
`@graphorin/security/sandbox`: a `worker-threads`-tier primitive that evaluates source
as the body of an `async (tools) => { … }` function and exposes `tools` as RPC stubs
that round-trip each call to an injected host `dispatch`. It reuses the
`worker-threads` adapter's `node:fs` / `node:net` import blocking + `fetch` refusal,
enforces a wall-clock timeout (`worker.terminate()`), an optional memory ceiling, an
`AbortSignal`, and a tool-call budget. The worker reaches the host through **nothing
but** the tool-call channel, and that channel serves only the `allowedTools` names —
no reference to the registry/executor/any host object survives `structuredClone`. The
audited handler runtimes (`createNoneSandbox` / `createWorkerThreadsSandbox`) are
untouched. As with the `worker-threads` tier this is best-effort defence in depth, not
a guarantee against process-level mischief; layer `isolated-vm` / `docker` for
V8-grade isolation.

**Code surface (`@graphorin/tools`).** New `@graphorin/tools/code-mode`:
`projectToolApi(tools)` (registry → typed code API: catalogue + per-tool signatures
rendered best-effort from JSON Schema) and `createCodeExecuteTool` /
`createCodeSearchTool`.

**Governance preserved (`@graphorin/agent`).** Each in-script call routes through the
same executor (`executeOne`) under the calling step's `runContext`, so per-tool
`secretsAllowed` / `inboundSanitization` / `maxResultTokens` still apply; the inner
executor carries no streaming sink, so its events do not interleave into the outer
stream. A large final result still spills to a handle (`code_execute` opts into
`'spill-to-file'`; `read_result` is advertised in code-mode). Two scoped limitations:
**approval-gated tools** (`needsApproval`) are excluded from the code API (no
durable-HITL suspend mid-script — call those in `'direct'` mode), and code-mode does
not honour a per-step `prepareStep` `tools` override. New public API:
`runBridgedSource` / `BridgedSourceOptions` / `BridgedSourceResult` / `BridgedToolCall`
(`@graphorin/security/sandbox`); `@graphorin/tools/code-mode`; `AgentConfig.toolInvocation`.
The default `'direct'` path is byte-for-byte unchanged (R10). Fully offline (R4).
