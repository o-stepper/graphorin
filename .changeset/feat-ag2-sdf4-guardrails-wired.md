---
'@graphorin/agent': patch
---

feat(agent): wire `AgentConfig.guardrails` into the run loop on the canonical security contract (AG-2 / SDF-4)

`AgentConfig.guardrails` was accepted and silently ignored — no input or output
guardrail ever executed, and the documented `guardrail.tripped` event was never
emitted, while the working guardrail library in `@graphorin/security`
(`composeGuardrails` + 7 built-ins) had zero consumers.

Per the SDF-4 contract decision, the canonical guardrail shape is
`@graphorin/security`'s `GuardrailDefinition` — the agent-local bare-predicate
`InputGuardrail`/`OutputGuardrail`/`GuardrailVerdict` types are **deleted** and
the security forms re-exported in their place:

- **Input guardrails** run over each fresh-run seed user message (string
  content) before the first provider call: `block` fails the run with
  `guardrail-blocked` without reaching the model, `rewrite` replaces the
  message content in both the working buffer and the persisted `RunState`,
  `warn` continues.
- **Output guardrails** run over the final output on the completed path
  before `agent.end`: `block` fails the run; `rewrite` replaces
  `result.output` (the durable result — text deltas were already streamed).
- Every trip emits the documented `guardrail.tripped` event (phase
  `input`/`output`).

The security built-ins (`piiDetection`, `promptInjectionHeuristics`,
`maxLength`, `languageWhitelist`, …) now plug straight into `createAgent`.
