---
'@graphorin/workflow': minor
'@graphorin/core': minor
---

Phase 13 — initial release of `@graphorin/workflow`. The new package
ships the **step-graph workflow engine** — the durable, graph-based
runtime for complex multi-step operations: HITL approvals that
survive process restarts, conditional branches and parallel
fan-outs, dynamic parallelism via `Dispatch(...)`, six channel-merge
strategies, and a pluggable `CheckpointStore` so any thread can be
resumed from the last successful checkpoint.

`@graphorin/workflow` ships:

- **`createWorkflow({...})` + `Workflow` handle.** The single entry
  point that wires every public surface. The factory accepts the
  canonical config shape (`name`, `nodes`, `edges`, `channels`,
  `initialState?`, `pauseAt?`, `checkpointStore`, `durability?`,
  `tracer?`, `maxSteps?`, `cancelGraceMs?`, `validateState?`).
  Construction-time validation surfaces
  `InvalidWorkflowConfigError` and `UnknownNodeError` for malformed
  inputs so misuse is caught early. The returned `Workflow<TState,
  TInput>` exposes `execute / resume / getState / listCheckpoints /
  fork`.
- **`createNode({...})` factory.** Minimal wrapper that produces a
  frozen `WorkflowNode<TState>` carrying the supplied `name` +
  `run(state, ctx)` callback. Nodes can return `void`, a partial
  state delta, a single `Dispatch`, or a heterogeneous array of
  partial deltas + dispatches — the engine's harvester normalizes
  every shape into channel writes + dynamic tasks.
- **Streaming-first runtime.** `Workflow.execute(input, opts?)`
  returns `AsyncIterable<WorkflowEvent<TState>>`; the
  `WorkflowEvent<TState>` discriminated union covers every emit the
  engine produces (`workflow.start`, `workflow.step.start`,
  `workflow.step.end`, `workflow.task.start`, `workflow.task.end`,
  `workflow.channel.update`, `workflow.checkpoint.written`,
  `workflow.suspended`, `workflow.resumed`, `workflow.end`,
  `workflow.error`, `workflow.custom`). Stream modes (`values`,
  `updates`, `messages`, `tasks`, `checkpoints`, `debug`, `custom`)
  let callers choose granularity per call.
- **Synchronous-step semantics.** Each iteration of the engine
  loop performs the documented `plan -> execute -> apply ->
  checkpoint` cycle: gather every triggered task (edge-driven +
  pending dynamic + resumed), execute them in parallel under a
  shared `AbortController`, merge their writes atomically per
  channel kind, persist the checkpoint per the configured durability
  mode, and start the next step.
- **Channel descriptors as merge strategies.** `LatestValue`
  (overwrite, error on collision), `AnyValue` (last-writer-wins
  silently), `Reducer((prev, next) => merged)`, `ListAggregate`
  (append; flattens single values + nested arrays), `Stream`
  (append-only queue; `unique: true` deduplicates via deep equality),
  `Barrier(['a', 'b'])` (collect per-source writes; ready when every
  named writer has produced a value), `Ephemeral` (per-step value
  cleared at the next step boundary). Every kind has its own
  documented semantic, version-bumped per write, and is covered by
  property-style unit tests.
- **HITL via `pause(value)`.** Inside a node, `pause(...)` throws a
  `PauseSignal` carrying the value passed to it; the engine catches
  it, persists state with a structured `PendingPauseRecord` in the
  checkpoint metadata, and yields a `workflow.suspended` event. The
  resume path runs the node body again inside a
  `runWithPauseResume(value, fn)` scope — the same `pause(...)` call
  consumes the operator-supplied value and returns it instead of
  throwing, giving consumers the symmetric `pause` ↔ `resume` pair
  semantics without forcing every node body to be re-architected as
  a state machine.
- **Static `pauseAt`.** `createWorkflow({ ..., pauseAt: { before:
  ['shipOrder'], after: ['chargeCard'] } })` declares HITL boundaries
  without hand-rolling `pause(...)` inside the node body. The engine
  suspends before listed nodes' `run(...)` is invoked OR after the
  step that completed the named node.
- **Dynamic parallelism via `Dispatch(node, args)`.** A node returns
  one or more `Dispatch('processOrder', { id })` directives; the
  engine schedules each as a parallel task in the next execution
  step, plumbing the supplied `args` into the resumed node's
  `ctx.dispatchArgs` field.
- **Durable execution + `CheckpointStore` plumbing.** Every step end
  writes a `Checkpoint` through the pluggable interface from
  `@graphorin/core`. Three durability modes
  (`'sync' | 'async' | 'exit'` — default `'sync'`) trade off latency
  vs guaranteed persistence. The package ships an
  `InMemoryCheckpointStore` adapter for tests + small examples;
  production deployments plug in the `SqliteCheckpointStore` from
  `@graphorin/store-sqlite`. The integration test in this package
  verifies the full round-trip against the real SQLite stack
  (suspend in writer process, resume in reader process, fork from
  any historical checkpoint).
- **`Workflow.getState / listCheckpoints / fork`.** First-class
  introspection: `getState(threadId)` returns the latest snapshot
  (`status`, `state`, `pendingPause`, `checkpointId`); `listCheckpoints
  (threadId)` enumerates every persisted checkpoint for replay /
  audit tooling; `fork(threadId, fromCheckpointId)` clones the
  source thread under a fresh thread id so parallel timelines branch
  off any historical checkpoint without touching the original.
- **Cancellation via `AbortSignal`.** `Workflow.execute(input, {
  signal })` honours the supplied signal; aborting it stops the run
  within the configurable grace window (default `100 ms`,
  configurable via `createWorkflow({ cancelGraceMs })`) and emits a
  structured `WorkflowAbortedError` carrying the `'workflow-aborted'`
  code. Pending tasks see the same signal via `ctx.signal` so node
  bodies can perform cleanup.
- **Concurrent-resume guard.** Per-thread mutex rejects a second
  in-flight resume with `ConcurrentResumeError` so two callers
  cannot both consume the same `Directive({ resume })` payload.
- **Typed observability.** Pass the `tracer` from
  `@graphorin/observability` to record nested
  `workflow.run / workflow.step / workflow.task / workflow.checkpoint`
  spans. Every span carries the workflow name, the thread id, and
  the step / task identifiers as attributes.
- **Typed error surface.** `WorkflowError` base class with the
  stable `code` discriminator covers `invalid-config`,
  `invalid-channel-write`, `multi-write-into-latest-value`,
  `unknown-node`, `cycle-detected`, `thread-not-found`,
  `checkpoint-not-found`, `checkpoint-version-conflict`,
  `concurrent-resume-rejected`, `resume-without-suspension`,
  `workflow-aborted`, `workflow-cancel-timeout`,
  `node-execution-failed`, `reducer-failed`,
  `state-validation-failed`. Validation errors during resume are
  surfaced as `workflow.error` events for parity with the streaming
  contract; configuration errors throw at `createWorkflow(...)`
  time.

`@graphorin/core` extensions:

- `pause(value)` is now AsyncLocalStorage-aware. Outside a managed
  scope it still throws a fresh `PauseSignal` carrying the supplied
  value (existing contract unchanged). The new
  `runWithPauseResume(value, fn)` helper wraps a callback in a
  resume-injection scope so the next `pause(...)` call inside `fn`
  returns the operator-supplied resume value instead of throwing.
  The helper is the contract between the workflow runtime and the
  paused node body; consumers of `pause(...)` keep their existing
  call sites unchanged. The `PauseResumeScope` type is exported for
  custom runtimes that want to opt into the same convention.

- **Versioned checkpoint envelope.** Persisted state is wrapped in
  a `{ schema: 'graphorin-workflow-checkpoint/1.0', state }`
  envelope so the on-disk shape can evolve without invalidating
  older checkpoints; the runtime transparently unwraps both the
  versioned envelope AND the v0.1-alpha raw-state shape on read.
  The `CHECKPOINT_SCHEMA_VERSION` constant is exported from the
  public surface for consumer-side migrations.
- **Cancellation grace timeout.** The per-step task race honours
  `cancelGraceMs` (default 100 ms) so a workflow always returns
  control within the grace window even if a node ignores
  `ctx.signal`. Tasks that ignore the signal continue running in
  the background; the documented contract matches ADR-037 (stream
  cancellation hard-kill default).

`pnpm test` — 102 new tests across the `@graphorin/workflow` package
covering: every `createWorkflow({...})` validation path (16 tests);
the reference order-processing workflow end-to-end on both the
auto-approve (low-value) and HITL approval (high-value) branches;
multi-step HITL with two distinct pause nodes round-tripping
correctly; HITL `pause` / `resume` round-trip across two independent
`Workflow` instances sharing a `CheckpointStore`; the rejection
path for resume-without-suspension and concurrent-resume; the
`InMemoryCheckpointStore` adapter (every CRUD path including
`pendingWrites`, `list({ before, status, limit })`, and
`deleteThread` namespace cleanup — 17 tests); the real SQLite
`SqliteCheckpointStore` integration round-trip + fork; channel
correctness for every kind (12 tests) PLUS property-style
concurrency invariants over deterministic random orderings (7
tests) covering Reducer order-independence, ListAggregate
multiset preservation, Stream uniqueness, Barrier per-source
collection, AnyValue last-writer-wins, LatestValue collision
rejection, and Ephemeral per-step lifecycle; `Dispatch` dynamic
parallelism; `Workflow.fork(...)` from a historical checkpoint;
cancellation via `AbortSignal` (pre-aborted, mid-step abort with
< 100 ms timing assertion, store integrity post-abort);
the three durability modes; `validateState` hook + maxSteps
infinite-loop safeguard + node-error checkpoint persistence;
static `pauseAt.before / after` suspensions; every stream mode
(values / updates / messages / tasks / checkpoints / debug /
custom — 7 tests covering the full per-mode emit gate); the
observability span recorder verifying `workflow.run /
workflow.step` are produced and ended; the naming-enforcement
guard verifying that no third-party workflow library identifiers
appear anywhere in the package's source (and asserting the public
Graphorin-named primitives are exposed); and the
no-`@graphorin/agent`-dependency boundary CI assertion verifying
the package's `dependencies / devDependencies / peerDependencies`
manifest does NOT list any sibling `@graphorin/agent*` package
AND the package's source never imports from `@graphorin/agent`.
Coverage: 93.42 % statements, 82.3 % branches, 96.29 % functions,
93.42 % lines — comfortably above the 85 % DoD threshold across
every metric.

Workspace-wide: every other package's tests remain green
(`@graphorin/core`, `@graphorin/security`, `@graphorin/provider`,
`@graphorin/tools`, `@graphorin/skills`, `@graphorin/mcp`,
`@graphorin/memory`, `@graphorin/observability`,
`@graphorin/sessions`, `@graphorin/store-sqlite`,
`@graphorin/embedder-transformersjs`,
`@graphorin/embedder-ollama`, `@graphorin/triggers`,
`@graphorin/pricing`, `@graphorin/provider-llamacpp-node`,
`@graphorin/agent`, `@graphorin/eslint-plugin`); `pnpm run
check-no-network: PASS`; `pnpm run build` succeeds for every
package; `pnpm run typecheck` is green across all 18 packages
including the new `@graphorin/workflow`; `pnpm run lint` reports
zero errors. Workspace-wide aggregate test count: 19 packages,
~2,373 tests, all green when run serially via
`pnpm -r --workspace-concurrency=1 test`. `@graphorin/workflow`
ships 102 tests.
