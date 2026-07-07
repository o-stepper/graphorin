---
title: Glossary
description: The shared vocabulary used throughout the Graphorin documentation.
---

# Glossary

The shared vocabulary used throughout the Graphorin documentation, in alphabetical order.

## A

**Agent.** A typed unit of behaviour that runs the `model -> tool calls -> model` loop. Created with `createAgent({...})` from `@graphorin/agent`.

**Agent registry.** Per-session record of every agent that participated, with metadata. Owned by `@graphorin/sessions`.

**`AgentEvent<TOutput>`.** The discriminated event union the agent runtime emits for streaming consumption.

**`AnyValue`.** Channel descriptor that uses last-writer-wins on a multi-write step. Lives in `@graphorin/core/channels`.

**Approval.** A blocking gate raised when a tool's `needsApproval` predicate (or constant `true`) fires. Surfaces as the `tool.approval.requested` agent event; resolved through `tool.approval.granted` / `tool.approval.denied`.

**Audit log.** Tamper-evident SQLite log of every privileged operation. SHA-256 hash chain; always encrypted at rest (the audit database refuses to open without the cipher peer).

## B

**Barrier.** Channel descriptor that waits for a named set of writers. Lives in `@graphorin/core/channels`.

**Bi-temporal.** Storage pattern with both a `validFrom` / `validTo` window and a `recordedAt` timestamp. Used by semantic memory.

## C

**Channel.** A typed slot in the workflow engine's per-step state. Each channel has a descriptor (`LatestValue`, `Reducer`, `Stream`, `Barrier`, `Ephemeral`, `AnyValue`, `ListAggregate`) that defines its merge semantics.

**Checkpoint.** A serialised snapshot of a workflow thread's state at the end of an execution step.

**Conflict pipeline.** The five-stage pipeline that decides whether a new fact dedups, supersedes, gets admitted as `pending`, or is admitted clean. Lives in `@graphorin/memory`.

**Consolidator.** Background process that distils long conversations into long-term memory in three phases - light / standard / deep. Lives in `@graphorin/memory`.

**Context engine.** The component that can assemble a memory-aware system prompt and drives auto-compaction. Today the agent runtime invokes it for **auto-compaction** only; the per-step prompt is built from the agent's `instructions`, and the model reaches memory through the memory tools it calls (`tools: memory.tools`).

**Contextual retrieval.** Prepending a short situating context to a fact before it is indexed, so a terse fact stays findable (Anthropic's *Contextual Retrieval*). The default `late-chunk` mode is deterministic + offline; an opt-in consolidator `llm` mode authors a richer prefix.

## D

**`Directive`.** Workflow-engine primitive that controls the next-step decision (resume, branch, halt). Lives in `@graphorin/core/channels`.

**`Dispatch`.** Workflow-engine primitive that schedules dynamic parallel tasks in the next execution step. Lives in `@graphorin/core/channels`.

**Durable HITL.** Human-in-the-loop that survives a process restart. Powered by `runStateToJSON()` / `runStateFromJSON()` in the agent runtime and `pause` / `resume` in the workflow engine.

## E

**Embedder.** Component that produces dense vector representations of text. Default is `@graphorin/embedder-transformersjs`.

**Entity graph.** In-SQLite `(subject, predicate, object)` graph over canonical entities, with reversible, audited merges. Backs one-hop associative search (`search(..., { expandHops: 1 })`). Opt-in via `createMemory({ graph })`.

**`Ephemeral`.** Channel descriptor whose value lives only for the current step. Lives in `@graphorin/core/channels`.

**Episodic memory.** The "autobiography" tier - events, decisions, and milestones with bi-temporal validity.

## F

**Fan-out.** `agent.fanOut({...})` (a thin wrapper over the standalone `runFanOut(...)`) - agent-step-level parallelism with bounded concurrency, per-child budgets, and four built-in merge strategies (`'concat'`, `'first-success'`, `'judge-merge'`, `'custom'`).

**Filter.** Serialisable transform applied to messages crossing a multi-agent handoff boundary. Lives in `@graphorin/agent`.

## H

**Handoff.** Transfer of control between agents in the same session. Recorded as a typed `HandoffRecord`.

**Hybrid search.** Search that fuses dense-vector and full-text (FTS5) results. Default fusion is Reciprocal Rank Fusion with `k=60`; an opt-in **weighted fusion** can be calibrated against labelled data.

## I

**Idempotency key.** `Idempotency-Key` HTTP header that lets the standalone server deduplicate retried `POST` requests within the configured TTL.

**Insight.** Derived, higher-order memory synthesised by the consolidator's reflection pass from episodes + facts. Read-only (`memory.insights`); carries mandatory citations and is quarantined until validated.

**Iterative retrieval.** A gated grade-then-reformulate recall loop (CRAG / Self-RAG) for hard multi-hop questions - `searchIterative(...)` and the opt-in `deep_recall` tool. Abstains rather than confabulating.

## L

**`LatestValue`.** Channel descriptor that overwrites and throws on multi-writer collisions. Lives in `@graphorin/core/channels`.

**`ListAggregate`.** Channel descriptor that appends. Lives in `@graphorin/core/channels`.

**Locale pack.** Per-language regex / predicate set that powers stages 3 and 4 of the conflict pipeline. English ships by default.

## M

**MCP.** Model Context Protocol - a public protocol for tool / prompt / resource servers. Graphorin's client wraps `@modelcontextprotocol/sdk` over stdio and Streamable HTTP.

**Memory tier.** One of `working` / `session` / `episodic` / `semantic` / `procedural` / `shared`. Each has its own lifecycle and surface.

**Middleware composer.** `composeProviderMiddleware([...])` from `@graphorin/provider`. Wraps a provider in a chain validated against the canonical order `withTracing → withRetry → withRateLimit → withCostLimit → withCostTracking → withFallback → withRedaction` (outermost → innermost). Throws `MiddlewareOrderingError` on violation; the production-startup hook also refuses to boot a server that does not include `withRedaction`.

## P

**`pause(value)`.** Workflow primitive that suspends a thread. Lives in `@graphorin/workflow`. Pairs with `resume(directive)`.

**`Provider`.** The single interface every LLM adapter implements. Lives in `@graphorin/provider`.

**Procedural memory.** The "how-to" tier - workflows, recipes, learned patterns. Procedures can be authored (`define`) or **induced** from successful agent trajectories (AWM-style; `induce`), the latter quarantined until validated.

**Progress artifact.** UTF-8 text artifact persisted via atomic-write `.tmp + rename` for cross-session continuity. Owned by `agent.progress`.

**Provenance.** Two distinct senses: (1) the memory-row origin tag (`user` / `tool` / `extraction` / `reflection` / `induction` / `imported`) that gates recall trust; (2) the agent data-flow taint label used by the data-flow policy. See [Security](/guide/security).

## Q

**Quarantine.** A retrieval-trust state (`status: 'quarantined'`) that excludes a memory row from default recall without deleting it. Derived or injection-flagged writes land quarantined until promoted with `fact_validate`. See [Security § Memory safety](/guide/security#memory-safety-provenance-quarantine).

## R

**Reciprocal Rank Fusion (RRF).** Default reranker for hybrid search; combines vector and FTS5 ranks with `k=60`. The `WeightedRRFReranker` generalises it with per-retriever weights (equal weights reproduce RRF exactly).

**Replay.** Reconstruction of a past run from the audit log + JSONL export. Sanitised by default; opt in to live re-execution.

**`Reducer`.** Channel descriptor with a custom `(prev, next) => merged` merge function. Lives in `@graphorin/core/channels`.

**`RunState`.** Serialisable snapshot of an agent run. `runStateToJSON(state)` / `runStateFromJSON(serialised)` round-trip the full state.

## S

**Sandbox tier.** `'none'` / `'worker-threads'` (the default) / `'isolated-vm'` / `'docker'`. Resolved per tool call by `resolveSandbox(...)` in `@graphorin/security`.

**`SecretRef`.** A `<scheme>:<scheme-specific-part>` URI that names where a secret lives (e.g. `env:OPENAI_API_KEY`, `keyring:my_key`, `file:///abs/path`, `op://vault/item/field`). Resolved through a pluggable resolver registry in `@graphorin/security`.

**`SecretValue`.** A wrapper that prevents accidental logging / serialisation of a secret. Interface in `@graphorin/core`; runtime in `@graphorin/security`.

**Semantic memory.** The "facts about you, the world, the task" tier. Bi-temporal; multi-stage conflict resolution.

**Sensitivity.** The `'public'` / `'internal'` / `'secret'` tag carried by every message, memory row, tool result, and trace attribute.

**Session.** The unit of conversation that survives across turns and (when persisted) process restarts. Owned by `@graphorin/sessions`; messages owned by `@graphorin/memory.session.*`.

**Session tier.** Memory tier holding the rolling message log.

**`Stream`.** Channel descriptor; append-only queue with optional uniqueness. Lives in `@graphorin/core/channels`.

## T

**Token counter.** Per-provider strategy that estimates the token cost of a message list. Pluggable via `@graphorin/provider/counters`.

**Tool.** Typed callable declared with `tool({...})` from `@graphorin/tools`. Carries Zod input / output schemas, `Sensitivity`, `sideEffectClass` (`'pure' | 'read-only' | 'side-effecting' | 'external-stateful'`), `needsApproval`, and sandbox-tier metadata.

**`ToolExecutionContext`.** The context object passed into tool `execute(input, ctx)` calls. Carries `toolCallId`, the parent `runContext`, `signal`, `tracer`, `logger`, the scope-bound `secrets` accessor, and the `reportProgress` / `streamContent` emitters.

**`ToolExecutor`.** Component that runs `Tool[]` invocations. Parallel-by-default, approval-aware, sandbox-aware.

**`ToolRegistry`.** Component that hosts every registered tool with collision policies.

**Trigger.** Background cron / interval / idle / event registration. Owned by `@graphorin/triggers`.

## W

**Working memory.** The "current task" tier. Short structured blocks holding what the assistant is doing right now.

**Workflow.** Durable step-graph execution unit. Owned by `@graphorin/workflow`.

