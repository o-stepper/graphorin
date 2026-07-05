# approval-workflow

> Workflow HITL durable-resume acceptance demo for **graphorin** - wires `@graphorin/workflow`'s step-graph engine to a four-node expense-approval pipeline that pauses on high-value submissions, survives a simulated server restart, and resumes from the persisted SQLite checkpoint with `new Directive({ resume: { approved: true, reason: 'OK' } })`.

The example is small (≈300 lines of source, two files) but it exercises every stream mode, every `WorkflowEvent` tag, and the full `pause(...)` / `Directive(resume)` lifecycle against the real `SqliteCheckpointStore` so CI never depends on a live LLM.

---

## First 5 minutes

If you only want to see the workflow run end-to-end:

```bash
pnpm install
pnpm --filter ./examples/approval-workflow build
pnpm --filter ./examples/approval-workflow test
pnpm --filter ./examples/approval-workflow dev
```

Expected dev output:

```
graphorin v0.6.1 approval-workflow auto - status=completed, approved=true, notifications=4.
graphorin v0.6.1 approval-workflow manual - status=suspended, suspendedAtNode='auto-approve-or-pause'.
graphorin v0.6.1 approval-workflow resume - status=completed, approved=true, processedAt='2026-…', notifications=4.
```

**What just happened?**

1. The auto-approve demo submitted a $50 expense; the `auto-approve-or-pause` node fast-pathed under the $100 threshold; the workflow ran `process-approved` → `notify` → `__end__` without ever pausing.
2. The manual-review demo submitted a $500 expense; the `auto-approve-or-pause` node called `pause({ reason: 'manual-review', amount, submitter })`; the workflow suspended and persisted the full state to SQLite.
3. The resume demo discarded the in-flight `Workflow` handle, built a brand-new `Workflow` instance from the same `SqliteCheckpointStore`, and called `workflow.resume(threadId, new Directive({ resume: { approved: true, reason: 'OK' } }))` to drive the paused thread to completion.

That is the full HITL pattern. The advanced section below walks through every acceptance scenario.

---

## Quick map of the source

```
examples/approval-workflow/
├── src/
│   ├── main.ts              # createApprovalWorkflow + runApprovalDemo + simulateServerRestart + CLI
│   └── types.ts             # ExpenseInput / ExpenseState / ApprovalDecision / NODE_NAMES
├── tests/
│   └── smoke.test.ts        # 6 vitest cases covering durability, events, stream modes
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

---

## The pause / resume pattern

Every node is a plain `createNode({...})`. The headline is the middle node - it inspects state at runtime and either fast-paths small expenses or calls `pause(value)` to suspend:

```ts
import { createNode, pause } from '@graphorin/workflow';

const decide = createNode<ExpenseState>({
  name: 'auto-approve-or-pause',
  run: (state) => {
    if (state.amount < 100) {
      return {
        approved: true,
        reason: `auto-approved (amount $${state.amount} < $100 threshold)`,
        notifications: [`auto-approved $${state.amount} for ${state.submitter}`],
      };
    }
    const decision = pause<{ reason: 'manual-review'; amount: number; submitter: string }, ApprovalDecision>({
      reason: 'manual-review',
      amount: state.amount,
      submitter: state.submitter,
    });
    return {
      approved: decision.approved,
      reason: decision.reason,
      notifications: [
        `manual-review decision recorded for ${state.submitter}: ` +
          `${decision.approved ? 'approved' : 'rejected'} (${decision.reason})`,
      ],
    };
  },
});
```

**How `pause(value)` works under the hood:**

- The first time the runtime invokes `decide.run`, `pause(...)` throws a `PauseSignal` carrying the supplied payload.
- The engine catches the signal, persists the workflow state to the configured `CheckpointStore`, and emits a `workflow.suspended` event whose `value` is exactly the payload passed to `pause(...)`.
- When the operator supplies a directive via `workflow.resume(threadId, new Directive({ resume: { ... } }))`, the engine re-invokes `decide.run` inside a resume scope so `pause(...)` *returns* the directive's resume payload instead of throwing - the rest of the function body executes normally and writes the resolved decision to the channels.

**The crucial invariant**: the `decide.run` function body is identical across pause and resume. The runtime alone decides whether `pause(...)` throws or returns. That symmetry is what lets the same source code survive a server restart mid-pause.

---

## The simulated-server-restart scenario

The example ships a `simulateServerRestart(...)` helper that captures the durability invariant in five lines:

```ts
export async function simulateServerRestart(
  options: SimulateServerRestartOptions,
): Promise<SimulateServerRestartResult> {
  const wf = createApprovalWorkflow({ checkpointStore: options.checkpointStore });
  const events = await collect(
    wf.resume(options.threadId, options.directive, { stream: 'debug' }),
  );
  const snapshot = await wf.getState(options.threadId);
  return { events, finalState: snapshot.state, status: snapshot.status, threadId: options.threadId };
}
```

The smoke test exercises it end-to-end:

```ts
const initial = await runApprovalDemo({
  amount: 500,
  submitter: 'bob',
  checkpointStore: handle.checkpoints, // SqliteCheckpointStore at :memory:
  threadId: 'manual-500',
});
expect(initial.status).toBe('suspended');
expect(initial.suspendedAtNode).toBe('auto-approve-or-pause');

// The previous Workflow instance is dropped on the floor - only the
// SqliteCheckpointStore reference is forwarded.
const resumed = await simulateServerRestart({
  checkpointStore: handle.checkpoints,
  threadId: 'manual-500',
  directive: new Directive({ resume: { approved: true, reason: 'OK' } }),
});
expect(resumed.status).toBe('completed');
expect(resumed.finalState.approved).toBe(true);
expect(resumed.finalState.reason).toBe('OK');
expect(resumed.finalState.processedAt).toBeDefined();
```

`simulateServerRestart(...)` instantiates a brand-new `Workflow` against the same `CheckpointStore` - byte-equivalent to the operator killing the host process between the suspend and the resume. The persistent SQLite database carries every channel value, every channel version, the pending-pause record, and the run status; a fresh runtime sees the suspended thread and resumes from the exact pause site.

---

## Stream-mode walkthrough

`workflow.execute(...)` and `workflow.resume(...)` accept a `stream:` option that controls which event kinds the engine emits:

| Stream mode      | Step events | Task events | Channel updates | Checkpoint writes | Custom (`ctx.emit`) |
| ---------------- | :---------: | :---------: | :-------------: | :---------------: | :-----------------: |
| `'values'`       |     yes     |     no      |       no        |        no         |          no         |
| `'updates'`      |     yes     |     no      |      yes        |        no         |          no         |
| `'messages'`     |     yes     |     no      |      yes        |        no         |          no         |
| `'tasks'`        |     no      |     yes     |       no        |        no         |          no         |
| `'checkpoints'`  |     no      |     no      |       no        |       yes         |          no         |
| `'custom'`       |     no      |     no      |       no        |        no         |         yes         |
| `'debug'`        |     yes     |     yes     |      yes        |       yes         |         yes         |

The `runApprovalDemo(...)` helper defaults to `'debug'` so every event tag flows into the result. The smoke test `'stream modes …'` case explicitly exercises `'values'` / `'updates'` / `'tasks'` against the auto-approve fast-path and asserts that each completes without throwing.

---

## All `WorkflowEvent` types

Every event the workflow runtime can emit, in the order it typically appears:

| Type                          | Meaning |
| ----------------------------- | ------- |
| `workflow.start`              | Run started. Carries the `threadId` and the workflow's stable `workflowId`. |
| `workflow.step.start`         | A new execution step is about to plan + dispatch tasks. Carries the snapshot state. |
| `workflow.task.start`         | A node task is starting inside the current step. Carries the `nodeName` + `taskId`. |
| `workflow.task.end`           | A node task finished - `status` is `'completed'`, `'failed'`, or `'paused'`. |
| `workflow.channel.update`     | A channel value changed; carries the `channel` name and the bumped version. |
| `workflow.checkpoint.written` | A new checkpoint was persisted to the `CheckpointStore`; carries the checkpoint id. |
| `workflow.step.end`           | The step finished; carries the post-merge state. |
| `workflow.suspended`          | The workflow paused. Carries the value passed to `pause(...)` and the current state. |
| `workflow.resumed`            | The workflow resumed from a `Directive`; carries the post-injection state. |
| `workflow.end`                | The run reached `__end__`; carries the final state. |
| `workflow.error`              | The runtime gave up (validation, abort, max-steps); carries `code` + `message`. |
| `workflow.custom`             | Application-defined event emitted from a node via `ctx.emit(name, payload)`. |

The smoke test asserts that every tag from `workflow.start`, `workflow.step.start` / `.end`, `workflow.suspended`, `workflow.resumed`, `workflow.end`, `workflow.checkpoint.written`, `workflow.task.start` / `.end`, and `workflow.channel.update` surfaces at least once across `execute(...) + resume(...)` on the manual-review path.

---

## Resuming from a server (REST)

When you front the workflow with `@graphorin/server`, the same `Directive` shape is accepted over HTTP. The workflow routes (mounted by `createWorkflowRoutes(...)`) expose:

```bash
# Start a workflow run.
curl -X POST http://localhost:3000/v1/workflows/expense-approval/execute \
  -H 'content-type: application/json' \
  -d '{
    "input": { "amount": 500, "submitter": "bob", "justification": "offsite travel" },
    "threadId": "thr_demo_500"
  }'

# Resume the paused thread with the approval payload.
curl -X POST http://localhost:3000/v1/workflows/expense-approval/resume \
  -H 'content-type: application/json' \
  -d '{
    "threadId": "thr_demo_500",
    "directive": { "resume": { "approved": true, "reason": "OK" } }
  }'

# Inspect run state at any point.
curl http://localhost:3000/v1/workflows/expense-approval/state?threadId=thr_demo_500
```

The smoke test stays at the workflow-library layer because spinning a server is unnecessary for the durability assertion - the round-trip through `SqliteCheckpointStore` is the proof. Use the curl examples above when you wire the example into a server deployment.

---

## CLI demo behaviour

```bash
pnpm --filter ./examples/approval-workflow dev
```

The CLI runs both demos in sequence against an in-process `:memory:` SQLite store:

1. `runApprovalDemo({ amount: 50, submitter: 'alice', threadId: 'demo-auto-approve' })` - completes without pausing.
2. `runApprovalDemo({ amount: 500, submitter: 'bob', threadId: 'demo-manual-review' })` - pauses at `auto-approve-or-pause`.
3. `simulateServerRestart({ threadId: 'demo-manual-review', directive: new Directive({ resume: { approved: true, reason: 'OK' } }) })` - drains the paused thread to completion.

There are no environment variables required. The example is hermetic by design: zero network I/O, zero external processes.

---

## Troubleshooting

- **`Module '"@graphorin/workflow"' has no exported member ...`** - ensure you ran `pnpm install` at the workspace root; the example consumes the workspace-linked packages.
- **`workflow.suspended` event missing on the auto-approve path** - that's expected. The `auto-approve-or-pause` node only calls `pause(...)` when `state.amount >= 100`. The smoke test asserts the absence on the $50 case as a regression guard.
- **`Stream mode 'values' returns no checkpoint events`** - also expected. `'values'` is a high-level mode; use `'debug'` to see every checkpoint write or `'checkpoints'` to see only those events.
- **`SqliteCheckpointStore` survives across `Workflow` instances?** - yes. The store is a stateful `better-sqlite3` connection; closing the store closes the database. The simulated-server-restart helper deliberately re-uses the same store reference to demonstrate that the workflow object is the only thing reconstructed.

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper`. Persisted SQLite traces are surfaced by **`graphorin traces`** when using the standalone server. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.6.1 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
