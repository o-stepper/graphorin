---
'@graphorin/agent': patch
'@graphorin/tools': patch
---

Reconcile the Tools and Agent-runtime guides with the shipped runtime (WI-07 / P0-4).

- **`documentation/guide/tools.md`** — replace the aspirational
  `createToolRegistry({ tools, collisionStrategy })` and bare-function
  `approvalGate` snippets with the real APIs: `createToolRegistry(...)` +
  `registry.register(tool, source)` + `registry.assertNoDuplicates(strategy, ctx)`,
  and the `ApprovalGate.request(call, approval)` shape alongside an
  `executeBatch(...)` call. Notes that `@graphorin/agent` builds and drives both
  for you and exposes the registry as `agent.registry`.
- **`documentation/guide/agent-runtime.md`** — new "Tool execution in the loop"
  section with a registry → eager/deferred → executor → events diagram. Documents
  parallel dispatch + event interleaving, deferred loading + `tool_search`,
  `examples` rendering, and exactly which classification fields the loop enforces
  today (`secretsAllowed`, `inboundSanitization`, `maxResultTokens`,
  `needsApproval`) versus those still pending (`sandboxPolicy` for inline tools,
  `memoryGuardTier`).

Documentation only; no code or public types change.
