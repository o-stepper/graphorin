---
'@graphorin/agent': minor
'@graphorin/tools': minor
'@graphorin/core': minor
---

Agent harness quality (audit 2026-07-04 Wave C, cluster C3).

- Recoverable error envelope: `ToolError` gains `recoverable` + `recoveryHint` (retry_later / check_input / try_alternative / report_to_user), stamped from the kind at the executor's completion funnel and rendered to the model as a bracketed recovery line under the familiar `Error: <message>`.
- Transparent bounded tool retry: `rate_limited` outcomes from pure/read-only tools (or tools with an `idempotencyKey`) silently re-execute with exponential backoff up to 3 total attempts (`ToolRateLimitError.retryAfterMs` wins); tune via executor `retry` / `AgentConfig.toolRetry`.
- Verifier seam: `AgentConfig.verifiers` run deterministic checks on every terminal response, emit `verifier.result` events, feed failures back as a user message and continue up to `maxVerifierRounds` (default 1); throwing verifiers count as passed. Deliberately no evidence-free self-reflection step.
- ACI: empty successful tool output renders as an explicit `(tool ran successfully with no output)` marker.
- Deterministic replay: opt-in `recordProviderResponses` journals each step's raw model response onto `RunState.steps[].providerResponse`; new `createReplayProvider(state)` re-drives a run offline and fails loudly on divergence.
