---
'@graphorin/evals': minor
---

WI-08 / P2-1 — make tool-use / harness reliability measurable and gate regressions in CI.

**Trajectory scorers (`@graphorin/evals/scorers`).** Five new pure-code, offline
scorers over a `Trajectory` (the recorded sequence of tool calls a harness made
for a task): `correctToolSelected`, `argumentValidity` (validates each call's
arguments against its tool's `inputSchema`), `redundantCallDetection`,
`recoveryAfterError`, and `finalStateCorrect` (goal-state compare). Exported from
the `scorers` barrel and the package root, alongside the `Trajectory` /
`TrajectoryToolCall` types. No network, no model.

**New hermetic benchmark `@graphorin/benchmark-tool-agent`.** Drives the real
`createAgent(...)` loop with a deterministic offline stub provider over a small
retail multi-tool task set (ordered flow, parallel dispatch, recovery from a
surfaced tool error), folds the `AgentEvent` stream into a `Trajectory`, scores
each run with the trajectory scorers, and reports `pass^1` / `pass^k` against a
committed baseline. A drop fails CI (`TOOL_AGENT_REGRESSION_STRICT=0` to report
without gating; `--smoke` relaxes it); a deliberately broken fixture proves the
gate trips. Wired into the repo-wide `benchmark:ci` chain. Fully offline (R4).
