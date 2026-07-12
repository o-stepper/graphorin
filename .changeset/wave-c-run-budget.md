---
'@graphorin/agent': minor
---

Run-level budget (W-084 residual, decision D-8): `agent.run(input, { budget: { maxCostUsd?, maxTokens?, onExceed? } })` enforces a per-run spend ceiling as a between-step precheck against the accumulated usage, sub-agents included. `'stop'` (default) resolves the run as `failed` with `error.code: 'budget-exceeded'` (stop-condition-cut precedent, partial state stays resumable); `'throw'` rejects with the new `AgentBudgetExceededError`. A cost ceiling without USD-priced usage WARNs once per run and stays inert; `maxTokens` is provider-independent. Also fixes run-level cost aggregation: `addUsage`/`accumulateUsage`/`addModelUsage` now fold reported `Usage.cost` instead of dropping it, so `AgentResult.usage.cost` reflects the whole run when pricing middleware is wired.
