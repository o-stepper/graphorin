---
'@graphorin/agent': minor
---

Child-run usage now folds into the parent run's accounting (W-033): handoff and `toTool` children fold their per-model usage into the parent's `RunState.usage`, `usageByModel` and usage accumulator on every outcome (completed or failed - tokens were spent either way), `FanOutResult` gains an additive `usage` field summing usage-reporting children, and run-level `gen_ai.usage.*` trace attributes now include delegated tokens. Operators relying on the previously near-zero parent usage should expect budget hooks and pricing to start seeing the real (larger) numbers. The handoff child seed is additionally sanitized to a well-formed transcript (the in-flight dangling tool call is stripped, orphan tool results dropped) - real providers reject those shapes with invalid-request.
