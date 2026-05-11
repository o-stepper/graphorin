---
'@graphorin/agent': minor
'@graphorin/core': minor
---

Phase 12 — initial release of `@graphorin/agent`. The new package
ships the **agent runtime** — the typed `model -> tool calls ->
model` loop, the streaming event surface, durable HITL approvals
via `RunState.toJSON / fromJSON` + a typed resume `directive`,
multi-agent handoffs (`Agent.toTool`, the filter library, secrets
isolation), the agent-level model fallback chain, the per-tool
preferred-model resolution, the agent-step-level fan-out helpers
exposed both as standalone functions AND as methods on the
`Agent` instance, the evaluator-optimizer iteration loop, the
structured progress-artifact APIs (likewise exposed both
standalone AND on the `Agent` instance), the lateral-leak defense
layer wired into the loop, and intra-loop reasoning preservation
on the assistant message buffer.

`@graphorin/agent` ships:

- **`createAgent({...})`.** The single entry point that wires
  every public surface. The factory accepts the canonical config
  surface (`name`, `instructions`, `provider`, `tools`, `skills`,
  `memory`, `handoffs`, `outputType`, `guardrails`, `stopWhen`,
  `toolChoice`, `prepareStep`, `contextEngine`,
  `maxParallelTools`, `fallbackModels`, `fallbackPolicy`,
  `preferredModel`, `modelTierMap`, `modelTierAutoClassification`,
  `reasoningRetention`, `causalityMonitor`, `mergeGuard`,
  `protocolGuard`, `checkpointStore`, `tracer`, `sensitivity`).
  Construction-time validation surfaces
  `InvalidAgentConfigError` and `InvalidPreferredModelError` for
  malformed inputs so misuse is caught early.
- **System-prompt assembly.** `config.instructions` is injected
  as the first `role: 'system'` message at the top of every fresh
  run's message buffer (and mirrored into `RunState.messages`)
  before any user input flows through. Empty-string instructions
  intentionally elide the system message so callers that wire
  their own system prompt via `prepareStep` are not double-shadowed.
- **Streaming-first agent loop.** `Agent.stream(input)` returns
  `AsyncIterable<AgentEvent<TOutput>>`; `Agent.run(input)` is the
  thin collect helper. Every event is typed in the
  `AgentEvent<TOutput>` discriminated union extended in this
  phase with the new variants `agent.steered`,
  `agent.followup.queued`, `agent.cancelling`,
  `agent.model.fellback`, `agent.fanout.spawned`,
  `agent.fanout.merged`, `agent.evaluator.iteration`,
  `agent.evaluator.converged`, `agent.progress.written`,
  `agent.progress.read`, `agent.lateral-leak.detected`. The
  `assertNever` exhaustiveness check in the loop dispatcher
  covers every variant.
- **Steering + follow-up queues.** `agent.steer(message)` queues
  a high-priority intervention into the next provider call within
  the current run AND emits an `agent.steered` event;
  `agent.followUp(message)` queues a follow-up turn after the
  current turn completes AND emits `agent.followup.queued`. Both
  events ride the in-band stream so observers see the
  intervention before the next provider call fires.
- **Handoff filter library.** `filters.lastN(n)`,
  `filters.lastUser`, `filters.full`, `filters.summary({...})`,
  `filters.bySensitivity({ maxTier })`,
  `filters.stripReasoning`, `filters.stripSensitiveOutputs`,
  `filters.stripToolCalls`, `filters.compose(...filters)`,
  `filters.custom(fn, meta?)`, `filters.defaultHandoffFilter()`.
  Every filter pairs a runtime function with a serializable
  `HandoffInputFilterDescriptor` so the JSONL session export
  (`@graphorin/sessions`) can replay the filter stack even after
  the runtime implementations evolve. `compose(...)` always
  appends `stripReasoning()` last so reasoning content never
  crosses a handoff boundary regardless of caller intent.
- **Multi-agent.** `Agent.toTool({ name?, description?,
  exposeTurns, secretsInheritance, inheritSecrets, inputFilter
  })` wraps an agent as a tool the parent agent can call. The
  default `secretsInheritance: 'inherit-allowlist'` with empty
  `inheritedSecrets` enforces the principle of least authority.
  All three `exposeTurns` modes are honoured: `'final'` (default)
  returns the sub-agent's final output; `'all'` collects every
  per-turn `text.complete` event and returns the joined turns;
  `'none'` returns the empty string (information minimization).
  `Agent.handoffs` registers `transfer_to_<agentName>` virtual
  tools; the runtime auto-records every handoff to
  `RunState.handoffs` with the serializable filter descriptor.
- **Durable HITL.** `RunState` carries the run lifecycle
  (`steps`, `messages`, `pendingApprovals`, `handoffs`,
  `usage`, `usageByModel`). `runStateToJSON` /
  `runStateFromJSON` round-trip the canonical schema
  `'graphorin-run-state/1.0'`; backward-compat synthesis applies
  for v0.1-alpha states that omit `usageByModel`. The runtime
  persists state through the optional `CheckpointStore` on every
  `awaiting_approval` boundary so a separate process can resume
  the run. Resume is a typed first-class API:
  `agent.run(savedState, { directive: { approvals: [...] } })`
  reads the suspended state, applies the
  `granted | denied | reason` decisions, emits the
  `tool.approval.granted` / `denied` events, and re-enters the
  loop from where it paused.
- **Cancellation.** `agent.abort({ drain, onPendingApprovals })`
  — hard-kill default; pending approvals can be auto-denied
  (`'deny'` default — auto-emits `tool.approval.denied` for every
  pending approval), held (`'hold'`), or raised as an error
  (`'fail'` — emits `agent.error { code: 'run-aborted' }`).
  `agent.cancelling` is emitted exactly once per abort, before
  the policy resolution.
- **Agent-level model fallback chain (RB-48).**
  `Agent.fallbackModels: ModelSpec[]` is consulted on
  fallback-eligible errors during the per-step provider call.
  `isAgentFallbackEligible(error, policy)` is a pure decision
  function exposed for consumer testing; the canonical mapping
  flags `rate-limit` / `capacity` / `context-length` as eligible
  by default and `transient` as opt-in. Per-model usage
  attribution lives in `RunState.usageByModel` with
  `attemptCount` per model. `agent.model.fellback` event fires
  exactly once per fallback transition before the new model's
  stream starts. `prepareStep({ provider })` overrides the
  fallback chain — when an explicit override is supplied the
  chain is NOT consulted (the user's explicit choice supersedes
  the implicit fallback chain).
- **Per-tool preferred-model resolution (RB-53).**
  `resolvePreferredModel({...})` walks the precedence ladder
  `'prepare-step' > 'tier-map' | 'spec' > 'agent-preferred' >
  'fallthrough-default'` once per step. Multi-tool tie-break
  picks the highest-cost tier (`'smart' > 'balanced' > 'fast'`;
  explicit `ModelSpec` is treated as the highest tier via the
  treat-as-smart rule). The documented-as-a-hint fallthrough
  discipline never throws — the planner always returns a usable
  provider, falling through to the agent default when nothing
  else matches.
- **Intra-loop reasoning preservation (RB-42).** The agent
  runtime resolves an effective `reasoningRetention` per step
  from the per-agent override OR the provider's
  `reasoningContract` capability (per RB-42 / suggested DEC-158).
  When the policy is `'pass-through-claude'` or
  `'pass-through-all'`, the assistant message stored in the
  buffer carries its `reasoning` content parts (with provider-
  supplied opaque metadata such as Anthropic's
  `signature` / `data` fields) so the next provider call honours
  the wire-correct round-trip contract. When the policy is
  `'strip'`, every `ReasoningContent` part is dropped from the
  buffer at the swap point. The handoff boundary is independent:
  `filters.stripReasoning()` always strips at handoff regardless
  of intra-loop policy.
- **Lateral-leak monitor wired into the loop (RB-55).** When
  `Agent.causalityMonitor` is set, the runtime records every
  tool call into the bounded-depth chain AND inspects every
  outgoing assistant message via
  `CausalityMonitor.checkMessage(...)`. Detections emit
  `agent.lateral-leak.detected` with the matched pattern,
  severity, decision, and the sha256 of the offending content
  (NEVER the content itself); operators choose detection-only,
  flag, or block disposition via the `strictness` field.
- **Compaction integration (RB-46).** `Agent.compact({ source?,
  preserveRecentTurns? })` calls
  `memory.contextEngine.compactNow(...)` against the in-flight
  `RunState.messages` and returns the compaction summary
  (`beforeTokens`, `afterTokens`, `summaryTokens`, `durationMs`,
  `hooksFiredCount`, `summary`). When no `memory` is wired the
  call returns a zeroed result so example apps without memory do
  not crash on the helper.
- **Agent-step-level fan-out (RB-50).** `runFanOut({...})` is
  the standalone helper; `Agent.fanOut({ children, perBudget,
  mergeStrategy, maxConcurrentChildren, signal })` is the
  per-instance method that auto-fills the runtime-supplied
  identifiers. Both spawn N children under a bounded-fanout cap
  (default `maxConcurrentChildren: 4`) with per-child token /
  tool-call / duration budgets and four built-in merge
  strategies (`concat`, `first-success`, `judge-merge`,
  `custom`). Failed-child isolation: a child that throws /
  exceeds budget / is cancelled produces a structured
  `ChildResult` slot — neither helper throws.
  `agent.fanout.spawned / merged` events carry the full
  per-child metadata for forensic correlation.
- **Evaluator-optimizer iteration loop (RB-50).**
  `evaluatorOptimizer({ generator, evaluator, maxIterations,
  rubric, mergeStrategy? })` returns the iteration outcome with
  a REQUIRED iteration cap. Three rubric kinds (`free-form`,
  `zod`, `llm-judge`); two merge strategies (`'last-iteration'`
  default, `'best-score'`). `agent.evaluator.iteration /
  converged` events fire per-iteration / at termination.
- **Progress IO (RB-50).** `createProgressIO({ artifactRoot,
  defaultSensitivity, redact })` returns a `ProgressIO` surface
  with atomic-write `.tmp + rename` discipline.
  `Agent.progress.write / read` are the per-instance methods
  that auto-bind the in-flight `runId` cursor. Cross-session
  continuity flow: write under `<artifactRoot>/<runId>/progress/
  <role>.<seqPadded>.txt`; cross-run reads require explicit
  `runId` cursor (no implicit auto-discovery). `redact` runs on
  the write path so the persisted file is the redacted bytes.
- **Lateral-leak defense layer primitives (RB-55).** Three
  primitives composing orthogonally with the four other security
  boundaries: `CausalityMonitor` (Agentic Reference Monitor
  pattern; bounded-depth chain; `'off' | 'detect' |
  'detect-and-flag' | 'detect-and-block'` strictness levels);
  `MergeAgentSidewaysInjectionGuard` (`computeSourceTrust`
  composes baseline trust class * provenance multiplier *
  history adjustment; `evaluateMerge` flags low-trust children
  contributing more than `maxLowTrustWeight`); the
  protocol/header injection guard (`guardOutboundContent`
  escapes control characters per the canonical per-boundary
  policy table — `sse` / `http-header` -> `strict`; `ws` /
  `rest-body` -> `replace`; `audit` -> `strict`; `reject`
  operator opt-in throws `ProtocolInjectionRejectError`).
- **Typed error surface.** `AgentRuntimeError` base class with
  the stable `code` discriminator covers `invalid-config`,
  `invalid-preferred-model`, `invalid-fallback-policy`,
  `invalid-evaluator-optimizer-config`,
  `agent-resolution-failed`, `tool-not-found`,
  `handoff-target-not-found`, `multiple-handoffs-in-step`,
  `run-aborted`, `middleware-order-violation`,
  `progress-write-failed`, `merge-blocked`,
  `protocol-injection-rejected`,
  `run-state-version-unsupported`, `run-state-malformed`.

`@graphorin/core` extensions:

- `AgentEvent<TOutput>` discriminated union extended with eleven
  new variants (`agent.steered`, `agent.followup.queued`,
  `agent.cancelling`, `agent.model.fellback`,
  `agent.fanout.spawned`, `agent.fanout.merged`,
  `agent.evaluator.iteration`, `agent.evaluator.converged`,
  `agent.progress.written`, `agent.progress.read`,
  `agent.lateral-leak.detected`). The shape is wire-stable; the
  `assertNever` exhaustiveness test in the core test suite is
  updated to cover every new variant.
- New shared types: `ProgressArtifactRef`,
  `FanOutChildMetadata`, `LateralLeakVector`,
  `RunStateUsageByModel`. The `RunState` interface gains an
  optional `usageByModel?: RunStateUsageByModel` field
  populated by the agent runtime's per-step retry loop.
- `flattenUsageByModel(byModel)` helper converts the on-disk
  per-model breakdown into the canonical `ModelUsage[]` array
  consumed by `@graphorin/observability` aggregators.

`pnpm test` — 99 new tests across the `@graphorin/agent` package
covering: every `createAgent({...})` validation path; the
hello-world acceptance (single-script, < 20 lines of user code);
the system-prompt assembly from `config.instructions`; the agent
loop on text-only and tool-using fixtures; the multi-agent
handoff path (`transfer_to_*` virtual tool); the
`Agent.toTool({...})` `exposeTurns: 'final' | 'all' | 'none'`
matrix; the agent-level fallback chain
(`agent.model.fellback` event ordering, chain exhaustion path,
prepareStep-overrides-suppress-fallback discipline); the
precedence-ladder resolver pure function; the cost-tier
vocabulary tie-break; the fallback eligibility dispatcher; the
run-state JSON round-trip including v0.1-alpha synthesis;
HITL durable resume (suspended-state JSON round-trip + directive
processing for granted / denied approvals); the filter library
(every filter, default composition, `compose(...)` always
appending `stripReasoning()`); the fan-out concat /
first-success / judge-merge strategies; failed-child isolation;
per-child duration budget enforcement; the evaluator-optimizer
iteration cap + best-score merge; progress IO write / read /
cross-run lookup / redaction; the causality monitor strictness
matrix + loop-integration smoke test; the merge-guard bias-
detection heuristic; the protocol-guard per-boundary escape
policy; reasoning content emission preserved across the loop;
`Agent.fanOut(...)` / `Agent.progress.write/read` instance
methods. Coverage thresholds set at 80 % per the package's
vitest config, mirroring the rest of the workspace.

Workspace-wide: every other package's tests remain green
(`@graphorin/core`, `@graphorin/security`, `@graphorin/provider`,
`@graphorin/tools`, `@graphorin/skills`, `@graphorin/mcp`,
`@graphorin/memory`, `@graphorin/observability`,
`@graphorin/sessions`, `@graphorin/store-sqlite`,
`@graphorin/embedder-transformersjs`,
`@graphorin/embedder-ollama`, `@graphorin/triggers`,
`@graphorin/pricing`, `@graphorin/provider-llamacpp-node`,
`@graphorin/eslint-plugin`); `pnpm run check-no-network: PASS`;
`pnpm run build` succeeds for every package; `pnpm run typecheck`
is green across all 17 packages including the new
`@graphorin/agent`. Workspace-wide aggregate test count: 28
packages × all green; `@graphorin/agent` ships 99 tests.
