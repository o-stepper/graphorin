# @graphorin/agent

> Agent runtime for the Graphorin framework.

`@graphorin/agent` is the agent layer of the Graphorin framework. It
owns the typed `model -> tool calls -> model` loop, the streaming
event surface, durable HITL approvals, multi-agent handoffs, and
the cross-cutting safety mechanisms (intra-loop reasoning
preservation, agent-level model fallback, post-compaction hooks,
per-tool model-tier hints, lateral-leak defenses).

The package is **library-mode-first**: every primitive that can be
useful from a script (`createAgent`, `RunState.toJSON / fromJSON`,
the filter library, `evaluatorOptimizer`, `Agent.fanOut`,
`agent.progress.write / read`) ships from the npm package without
the optional standalone server.

## Dependencies

- `@graphorin/core` — typed contracts (`AgentEvent`, `RunState`,
  `RunContext`, `Provider`, `Tool`, `StopCondition`, `HandoffFilter`,
  `Sensitivity`, …).
- `@graphorin/provider` — middleware composer assertion + token
  counter dispatcher + per-provider model-tier auto-classifier.
- `@graphorin/tools` — `ToolRegistry` + `ToolExecutor` (parallel /
  sequential dispatch, approval flow, sandbox enforcement, inbound
  sanitization).
- `@graphorin/skills` — skill metadata cards, lazy body loading.
- `@graphorin/memory` — `Memory` facade + `ContextEngine` for
  per-step prompt assembly + auto-compaction trigger.
- `@graphorin/sessions` — multi-agent attribution, handoff records,
  `AgentRegistry`, audit trail.
- `@graphorin/observability` — `Tracer`, span attributes, counter
  receivers.
- `@graphorin/security` — `SecretsAccessScope` for sub-agent
  inheritance, audit chain, lateral-leak guard primitives.

## Quick start

```ts
import { createAgent } from '@graphorin/agent';
import { createProvider } from '@graphorin/provider';

const agent = createAgent({
  name: 'helpful-assistant',
  instructions: 'You are a helpful, concise assistant.',
  provider: createProvider({ /* ... */ }),
});

for await (const event of agent.stream('Plan a trip to Mars')) {
  if (event.type === 'text.delta') process.stdout.write(event.delta);
}
```

## Highlights

- **Streaming-first.** Every operation returns
  `AsyncIterable<AgentEvent<TOutput>>`. `agent.run(...)` is a thin
  collect helper.
- **Typed events.** The `AgentEvent<TOutput>` discriminated union
  covers every event the runtime emits (text deltas, tool calls,
  approvals, handoffs, compaction, fan-out, evaluator iterations,
  progress artifacts, lateral-leak detections, model fallback
  transitions, …). `assertNever(...)` exhaustiveness is verified at
  compile time.
- **Durable HITL.** `RunState.toJSON()` /
  `RunState.fromJSON(serialized, agent)` round-trip the full run
  state through any storage the caller picks (file, SQLite, KV, S3).
- **Multi-agent.** `Agent.toTool({ exposeTurns,
  secretsInheritance, inheritSecrets, inputFilter })` wraps an
  agent as a tool the parent agent can call. The default
  `secretsInheritance: 'inherit-allowlist'` with empty
  `inheritedSecrets` enforces the principle of least authority.
- **Filter library.** `filters.lastN(n)`, `filters.lastUser`,
  `filters.summary({...})`, `filters.bySensitivity({...})`,
  `filters.stripReasoning()`, `filters.stripSensitiveOutputs()`,
  `filters.stripToolCalls()`, `filters.compose(...)`. Every filter
  returns a serializable `HandoffInputFilterDescriptor` so the
  JSONL session export can replay it byte-equal.
- **Cancellation.** `agent.abort({ drain, onPendingApprovals })` —
  the default hard-kills the in-flight provider stream mid-event;
  `drain: true` lets the current step's stream finish (reach its step
  boundary) before stopping. A mid-stream abort ends the run as
  `'aborted'` (a cancellation), never a failed run. Pending approvals
  can be auto-denied (`'deny'` default), held (`'hold'`), or raised as
  an error (`'fail'`).
- **Reasoning preservation.** Anthropic Claude tool-use loops
  round-trip `reasoning` content parts (with opaque `meta` such as
  `signature` / `data`) into the next provider call when the
  effective `reasoningRetention` is not `'strip'`. The handoff
  boundary is independent: `filters.stripReasoning()` is always
  applied to messages forwarded to a sub-agent regardless of the
  intra-loop policy.
- **Agent-level model fallback.** `Agent.fallbackModels: ModelSpec[]`
  retries the whole step against the next model on rate-limit /
  capacity / context-length errors; `agent.model.fellback` event
  fires per transition; per-model usage attribution lives in
  `RunState.usage.byModel`.
- **Post-compaction hook lifecycle.** When
  `@graphorin/memory.contextEngine` auto-compacts the buffer, the
  runtime fires every registered `postCompactionHooks[i]` between
  the trim and the next `provider.stream(...)` call. Failed hooks
  are isolated; the harness continues with the survivors.
- **Agent-step-level fan-out.** `Agent.fanOut({ subagents,
  mergeStrategy, perBudget, ... })` spawns N sub-agents under a
  bounded-fanout cap (default `maxConcurrentChildren: 4`) with
  per-child token / tool-call / duration budgets and four built-in
  merge strategies (`'concat'`, `'first-success'`, `'judge-merge'`,
  `'custom'`).
- **`evaluatorOptimizer({...})`.** Generator → Evaluator iteration
  loop with three rubric kinds (`'free-form'`, `'zod'`,
  `'llm-judge'`) + REQUIRED iteration cap.
- **Progress artifacts.** `agent.progress.write(content, { role,
  seq, sensitivity, tags })` and `agent.progress.read({ runId,
  role, sinceSeq, maxArtifacts })` persist UTF-8 text artifacts to
  the artifact root via atomic-write `.tmp + rename` discipline for
  cross-session continuity.
- **Per-tool model-tier hints.** `tool({ ..., preferredModel:
  'fast' | 'balanced' | 'smart' | ModelSpec })` declares a hint;
  `Agent.modelTierMap` resolves the cost-tier vocabulary to
  concrete `Provider` instances at agent warm-up; the per-step
  planner walks the precedence ladder
  `'prepare-step' > 'tier-map' | 'spec' > 'agent-preferred' >
  'fallthrough-default'` once per step.
- **Lateral-leak defense layer.** `Agent.causalityMonitor`
  (Agentic Reference Monitor pattern), `Agent.mergeGuard` (per-child
  trust scoring + bias detection on `'judge-merge'`), the protocol
  injection guard (control-character escape catalogue), and
  commentary-phase trace sanitization at the session-output
  boundary compose orthogonally with the other security layers
  (sub-agent secrets isolation, handoff input filter, outbound
  redaction, inbound sanitization).
- **Inbound sanitization preamble.** When the assembled message
  list contains any non-trusted `MessageContent` part, the runtime
  appends the locale-resolved preamble fragment to the system
  prompt **after** the cache breakpoint so the trusted-only cache
  prefix is not invalidated.

## Documentation

The full architecture lives in the framework docs (the agent loop
reference). The package's `CHANGELOG.md` records every change.

## License

MIT © Oleksiy Stepurenko. See [LICENSE](./LICENSE) for the full
text.

---

**Project Graphorin** · v0.4.0 · MIT License · © 2026 Oleksiy
Stepurenko · <https://github.com/o-stepper/graphorin>
