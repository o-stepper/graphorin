---
title: Workflow engine
description: A durable step-graph workflow engine with checkpoints, pause / resume across process restarts, dynamic parallelism, and human-in-the-loop primitives.
---

# Workflow engine

`@graphorin/workflow` is the durable workflow layer of the framework. It owns the synchronous-step execution loop, the Graphorin-named primitive set (`Directive`, `Dispatch`, `pause`, channel kinds `LatestValue` / `Reducer` / `Stream` / `Barrier` / `Ephemeral` / `AnyValue` / `ListAggregate`), the per-channel atomic merge resolver, the HITL `pause(...)` / `resume(directive)` lifecycle, and the `AbortSignal`-aware cancellation contract.

## Library-mode-first

Every primitive you need to write a small workflow ships from the npm package. No standalone server required:

- `createWorkflow({...})`
- `createNode({...})`
- `Directive`, `Dispatch`, `pause(value)`
- `latestValue`, `reducer`, `stream`, `barrier`, `ephemeral`, `anyValue`, `listAggregate`
- `InMemoryCheckpointStore`

For production, plug in `@graphorin/store-sqlite`'s `SqliteCheckpointStore` to get durable-by-default checkpoint persistence.

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
    const resumed = orderProcessing.resume(
      'order-42',
      new Directive({ resume: 'approved' }),
    );
    for await (const next of resumed) {
      console.log(next);
    }
  }
}
```

## Why durable

```mermaid
flowchart LR
    A[Process A starts run] --> B[Step 1\ncheckpointed]
    B --> C[Step 2\ncheckpointed]
    C --> D[pause: approval]
    D --> E[Process A exits]
    E --> F[Process B starts later]
    F --> G[Resume from checkpoint]
    G --> H[Step 3\ncheckpointed]
    H --> I[Done]
```

Every execution step ends with a checkpoint written through the pluggable `CheckpointStore`. A new process — even on a different machine — can pick up exactly where the previous one left off via `workflow.resume(threadId, directive)`. HITL is a primitive, not a bolt-on.

## Synchronous-step semantics

Tasks planned for an execution step run in parallel; their writes merge atomically per channel; the merged state is persisted; the next step plans against the new state. The semantics are documented for predictability under concurrent writes.

## Channel descriptors as merge strategies

| Descriptor | Merge behaviour |
|---|---|
| `LatestValue` | Overwrite; throws on a multi-write collision in the same step. |
| `AnyValue` | Last-writer-wins. |
| `Reducer((prev, next) => merged)` | Custom merge function. |
| `ListAggregate` | Append. |
| `Stream` | Append-only queue, optional uniqueness. |
| `Barrier(['a', 'b'])` | Wait for all named writers. |
| `Ephemeral` | Per-step value; not persisted. |

These names are part of the public API of `@graphorin/core/channels` and are not aliases for terms from any other workflow library.

## HITL via `pause(value)`

A node calls `pause(value)`; the engine catches the signal, persists state, and yields a `workflow.suspended` event with the supplied value attached. Calling `workflow.resume(threadId, new Directive({ resume }))` re-enters the paused node with the resumed value.

## Static `pauseAt`

Declare suspension points without hand-rolling `pause(...)` inside the node body:

```ts
createWorkflow({
  // …
  pauseAt: { before: ['shipOrder'], after: ['chargeCard'] },
});
```

## Dynamic parallelism via `Dispatch(node, args)`

A node returns one or more `Dispatch('processOrder', { orderId })` directives; the engine schedules each as a parallel task in the next execution step.

## Cancellation

```ts
const ac = new AbortController();
const stream = workflow.execute(input, { signal: ac.signal });
// later
ac.abort();
```

Aborting stops the run within the configurable grace window (default 100 ms) and produces a structured `WorkflowAbortedError`. Pending tasks see the same signal via `ctx.signal`.

## Stream modes

```ts
workflow.execute(input, { stream: 'updates' });
```

| Mode | Yields |
|---|---|
| `values` (default) | Final state at every step. |
| `updates` | Per-channel deltas. |
| `messages` | Message-shaped event projection (assistant turns + tool calls). |
| `tasks` | Task lifecycle events. |
| `checkpoints` | Checkpoint metadata. |
| `debug` | Everything, verbose. |
| `custom` | A node-defined trace. |

## Forking

`workflow.fork(threadId, fromCheckpointId)` creates a parallel timeline branched off a previous checkpoint without touching the original thread.

## Composition with `@graphorin/agent`

`@graphorin/workflow` does **not** depend on `@graphorin/agent`. The two compose orthogonally — a workflow node may invoke `agent.run(...)` directly from its `run(state, ctx)` body, but no import edge ever crosses between the two packages. Pick the right primitive for the job:

| Primitive | Lives in | Lifecycle | Durability |
|---|---|---|---|
| `Dispatch(...)` | `@graphorin/workflow` | per workflow execution step | checkpointed |
| `agent.fanOut(...)` | `@graphorin/agent` | per agent run (single agent step) | inline (no per-child checkpoint) |

Use `Dispatch(...)` when:

- the parallel work needs to **survive process restart**, OR
- the parallel tasks are durable graph nodes with their own edges, OR
- the parallel work spans **multiple workflow execution steps**.

Use `agent.fanOut(...)` when:

- the parallel work is inline within an agent's reasoning loop, AND
- the children are sub-agents, AND
- the result is consumed by the parent agent's continuing loop without checkpointing.

## Typed error surface

`WorkflowError` is the base class with a stable `code` discriminator. The full `WorkflowErrorCode` union covers:

`invalid-config`, `invalid-channel-write`, `multi-write-into-latest-value`, `unknown-node`, `cycle-detected`, `thread-not-found`, `checkpoint-not-found`, `checkpoint-version-conflict`, `resume-without-suspension`, `concurrent-resume-rejected`, `workflow-aborted`, `workflow-cancel-timeout`, `node-execution-failed`, `reducer-failed`, `state-validation-failed`.

## Pluggable observability

Pass the `tracer` from `@graphorin/observability` to record `workflow.run`, `workflow.step`, `workflow.task`, and `workflow.checkpoint` spans.

## Next steps

- [Agent runtime](/guide/agent-runtime) — pair workflows with agent runs.
- [Persistence](/guide/persistence) — wire a SQLite-backed checkpoint store.
- [Standalone server](/guide/standalone-server) — expose workflow lifecycle over REST.
- [Examples](/guide/examples) — durable approval workflow walkthrough in the repository.

---

**Graphorin** · v0.4.0 · MIT License · © 2026 Oleksiy Stepurenko
