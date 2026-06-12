# @graphorin/workflow

> Step-graph workflow engine for the Graphorin framework.

`@graphorin/workflow` is the durable workflow layer of the Graphorin
framework. It owns the synchronous-step execution loop, the
Graphorin-named primitive set (`Directive`, `Dispatch`, `pause`,
`LatestValue`, `AnyValue`, `Reducer`, `ListAggregate`, `Stream`,
`Barrier`, `Ephemeral`), the per-channel atomic merge resolver, the
HITL `pause(...)` / `resume(directive)` lifecycle, and the
`AbortSignal`-aware cancellation contract.

The package is **library-mode-first**: every primitive you need to
write a small workflow (`createWorkflow`, `createNode`, `Directive`,
`Dispatch`, `pause`, `InMemoryCheckpointStore`) ships from the npm
package without the optional standalone server.

## Dependencies

- `@graphorin/core` — typed contracts (`WorkflowEvent`, `Channel`,
  `Directive`, `Dispatch`, `pause`, `CheckpointStore`, …).
- `@graphorin/observability` — the `Tracer` interface used to record
  `workflow.run / workflow.step / workflow.task / workflow.checkpoint`
  spans.

For production deployments, plug in `@graphorin/store-sqlite`'s
`SqliteCheckpointStore` to get durable-by-default checkpoint
persistence.

## Quick start

```ts
import {
  createNode,
  createWorkflow,
  Directive,
  InMemoryCheckpointStore,
  latestValue,
  listAggregate,
  pause,
} from '@graphorin/workflow';

interface OrderState {
  status: 'pending' | 'validated' | 'approved' | 'shipped';
  notes: ReadonlyArray<string>;
  decision?: 'approved' | 'rejected';
}

const checkpointStore = new InMemoryCheckpointStore();

const orderProcessing = createWorkflow<OrderState>({
  name: 'order-processing',
  channels: {
    status: latestValue<OrderState['status']>({ default: 'pending' }),
    notes: listAggregate<string>({ default: [] }),
    decision: latestValue<OrderState['decision']>(),
  },
  nodes: {
    validate: createNode({
      name: 'validate',
      run: async () => ({ status: 'validated', notes: ['validated'] }),
    }),
    awaitApproval: createNode({
      name: 'awaitApproval',
      run: async () => {
        const decision = pause<{ kind: 'approval' }, 'approved' | 'rejected'>({
          kind: 'approval',
        });
        return { decision, status: decision === 'approved' ? 'approved' : 'pending' };
      },
    }),
    ship: createNode({
      name: 'ship',
      run: async () => ({ status: 'shipped', notes: ['shipped'] }),
    }),
  },
  edges: [
    { from: '__start__', to: 'validate' },
    { from: 'validate', to: 'awaitApproval' },
    { from: 'awaitApproval', to: 'ship', when: (s) => s.decision === 'approved' },
    { from: 'awaitApproval', to: '__end__', when: (s) => s.decision !== 'approved' },
    { from: 'ship', to: '__end__' },
  ],
  checkpointStore,
});

const stream = orderProcessing.execute({}, { threadId: 'order-42' });
for await (const event of stream) {
  if (event.type === 'workflow.suspended') {
    // ... show approval UI to operator ...
    const resumed = orderProcessing.resume(
      'order-42',
      new Directive({ resume: 'approved' }),
    );
    for await (const next of resumed) console.log(next);
  }
}
```

## Highlights

- **Durable execution.** Every execution step ends with a checkpoint
  written through the pluggable `CheckpointStore` from
  `@graphorin/core`, carrying the full resumable frontier (pending
  pauses, `Dispatch` tasks, completed-but-unwalked nodes). A new
  process can pick up exactly where the previous one left off via
  `workflow.resume(threadId, directive)` — including crashed threads
  whose latest checkpoint is `running` — and `retry(threadId)`
  restarts a `failed` thread re-running only the failed work
  (successful siblings replay from persisted writes). Checkpoint
  writes are CAS-guarded: a racing resume loses with
  `checkpoint-version-conflict` instead of forking the timeline.
  Resume re-executes the paused node body from the top (snapshot
  resume, not deterministic replay) — side effects before a
  `pause()` must be idempotent. Checkpoint state must be JSON-safe;
  `Map`/`Set`/`Date` fail fast with `state-not-serializable` on every
  store.
- **Synchronous-step semantics.** Tasks planned for an execution step
  run in parallel; their writes merge atomically per channel; the
  merged state is persisted; the next step plans against the new
  state. The semantics are documented for predictability under
  concurrent writes.
- **Channel descriptors as merge strategies.** `LatestValue`
  (overwrite, error on collision), `AnyValue` (last-writer-wins),
  `Reducer((prev, next) => merged)`, `ListAggregate` (append),
  `Stream` (append-only queue, optional uniqueness), `Barrier(['a',
  'b'])` (keyed join — a node fed by 2+ of the barrier's writers waits
  for every writer and runs exactly once), `Ephemeral` (per-step
  value).
- **HITL via `pause(value)`.** A node calls `pause(...)`; the engine
  catches the signal, persists state, and yields a
  `workflow.suspended` event. `workflow.resume(threadId, new
  Directive({ resume }))` re-enters the paused node with the supplied
  value.
- **Static `pauseAt`.** Declare `pauseAt: { before: ['shipOrder'],
  after: ['chargeCard'] }` to suspend without hand-rolling
  `pause(...)` inside the node body.
- **Dynamic parallelism via `Dispatch(node, args)`.** A node returns
  one or more `Dispatch('processOrder', { orderId })` directives;
  the engine schedules each as a parallel task in the next execution
  step.
- **Cancellation.** `workflow.execute(input, { signal })` accepts an
  `AbortSignal`; aborting it stops the run within the configurable
  grace window (default 100 ms) and produces a structured
  `WorkflowAbortedError`. Pending tasks see the same signal via
  `ctx.signal`.
- **Stream modes.** Pass `{ stream: 'updates' }` (or `'values'`,
  `'tasks'`, `'checkpoints'`, `'debug'`, `'custom'`) to choose the
  granularity of the emitted events.
- **`fork(threadId, fromCheckpointId)`.** Create a parallel timeline
  branched off a previous checkpoint without touching the original
  thread.
- **Pluggable observability.** Pass the `tracer` from
  `@graphorin/observability` to record `workflow.run`,
  `workflow.step`, `workflow.task`, `workflow.checkpoint` spans.
- **Typed error surface.** `WorkflowError` base class with the stable
  `code` discriminator covers `invalid-config`,
  `invalid-channel-write`, `multi-write-into-latest-value`,
  `unknown-node`, `thread-not-found`, `checkpoint-not-found`,
  `concurrent-resume-rejected`, `resume-without-suspension`,
  `workflow-aborted`, `node-execution-failed`, `reducer-failed`,
  `state-validation-failed`, `checkpoint-version-conflict`,
  `dead-end`, `state-not-serializable`.

## Composition with `@graphorin/agent`

`@graphorin/workflow` does **not** depend on `@graphorin/agent`. The
two compose orthogonally — a workflow node may invoke
`agent.run(...)` directly from its `run(state, ctx)` body, but no
import edge ever crosses between the two packages. The agent's
in-loop fan-out helper (`Agent.fanOut(...)`) and the workflow's
node-level `Dispatch(...)` solve different problems and live in
different lifecycles:

| Primitive            | Lives in                | Lifecycle                          | Durability          |
| -------------------- | ----------------------- | ---------------------------------- | ------------------- |
| `Dispatch(...)`      | `@graphorin/workflow`   | per workflow execution step        | checkpointed        |
| `Agent.fanOut(...)`  | `@graphorin/agent`      | per agent run (single agent step)  | inline (no per-child checkpoint) |

Use `Dispatch(...)` when the parallel work needs to survive process
restart, when the parallel tasks are durable graph nodes with their
own edges, OR when the parallel work spans multiple workflow
execution steps. Use `Agent.fanOut(...)` when the parallel work is
inline within an agent's reasoning loop, when the children are
sub-agents (not arbitrary node functions), AND when the result is
consumed by the parent agent's continuing loop without checkpointing.

## Documentation

The full architecture lives in the framework docs (the workflow
engine reference). The package's `CHANGELOG.md` records every
change.

## License

MIT © Oleksiy Stepurenko. See [LICENSE](./LICENSE) for the full
text.

---

**Project Graphorin** · v0.4.0 · MIT License · © 2026 Oleksiy
Stepurenko · <https://github.com/o-stepper/graphorin>
