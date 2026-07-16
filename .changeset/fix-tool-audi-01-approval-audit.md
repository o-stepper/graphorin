---
'@graphorin/agent': patch
'@graphorin/tools': patch
---

Fix denied durable-HITL approvals leaving no audit trace (e2e 2026-07-16, TOOL-AUDI-01, major). The agent pre-screens `needsApproval` and suspends the run before the tool reaches the executor, so the executor's approval phase - which emits the `tool:approval:requested` / `granted` / `denied` audit rows - only ran retroactively when a granted call was dispatched, and a denied decision (which never reaches the executor) produced no audit row at all. The agent now emits `tool:approval:requested` at the suspend and `tool:approval:granted` / `tool:approval:denied` when the resume directive resolves, so the full approval lifecycle is on the audit chain regardless of the decision. To avoid a duplicate row, the executor skips its own approval phase on a pre-approved replay (the agent already owns the audited grant). Regression test pins that a denied resume emits exactly one `tool:approval:denied` audit event.
