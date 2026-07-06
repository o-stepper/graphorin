import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/approval-workflow`. Every assertion
 * runs against the real `SqliteCheckpointStore` from `@graphorin/store-
 * sqlite` (path `:memory:`) so the durable-resume invariant is
 * exercised end-to-end:
 *
 *  1. Auto-approve fast-path ($50) completes without ever pausing.
 *  2. Manual-review path ($500) suspends at the decide node, survives
 *     a simulated server restart (fresh `Workflow` rebuilt from the
 *     same SQLite store), and completes with the resume payload
 *     visible in `processedAt` / `approved` / `reason` / `notifications`.
 *  3. Every documented `WorkflowEvent` tag (`workflow.start`,
 *     `workflow.step.start` / `.end`, `workflow.suspended`,
 *     `workflow.resumed`, `workflow.end`, `workflow.checkpoint.written`,
 *     `workflow.task.start` / `.end`, `workflow.channel.update`)
 *     surfaces at some point across `execute(...) + resume(...)`.
 *  4. Stream modes `'values'`, `'updates'`, `'tasks'` all complete
 *     without throwing on a small auto-approve workflow.
 *  5. Durable primitives (settlement stage): `sleepFor(...)` parks the
 *     thread on a persisted `wakeAt`, `workflow.tick(...)` fires the
 *     due timer, `awaitExternal(name)` re-parks it on the named
 *     awakeable, and `workflow.resolveAwakeable(...)` delivers the
 *     confirmation into the node result - once via manual ticks with
 *     an injected clock, and once via the real `createTimerDriver`
 *     sweep loop the CLI helpers use.
 */

import {
  type CheckpointStore,
  collect,
  Directive,
  isTimerPauseValue,
  type WorkflowEvent,
} from '@graphorin/core';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { namespaceFor } from '@graphorin/workflow';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  confirmSettlement,
  createApprovalWorkflow,
  createSettlementWorkflow,
  fireSettlementTimer,
  runApprovalDemo,
  runSettlementDemo,
  simulateServerRestart,
  VERSION,
} from '../src/main.js';
import {
  type ApprovalDecision,
  type ExpenseState,
  NODE_NAMES,
  SETTLEMENT_AWAKEABLE,
  SETTLEMENT_NODE_NAMES,
  type SettlementState,
} from '../src/types.js';

const REQUIRED_EVENT_TAGS: ReadonlyArray<WorkflowEvent<ExpenseState>['type']> = [
  'workflow.start',
  'workflow.step.start',
  'workflow.step.end',
  'workflow.task.start',
  'workflow.task.end',
  'workflow.channel.update',
  'workflow.checkpoint.written',
  'workflow.suspended',
  'workflow.resumed',
  'workflow.end',
];

interface StoreHandle {
  readonly store: GraphorinSqliteStore;
  readonly checkpoints: CheckpointStore;
  close(): Promise<void>;
}

async function openStore(): Promise<StoreHandle> {
  const store = await createSqliteStore({
    path: ':memory:',
    disableWalHardening: true,
    skipSqliteVec: true,
  });
  await store.init();
  return {
    store,
    checkpoints: store.checkpoints,
    async close() {
      await store.close();
    },
  };
}

describe('examples/approval-workflow - smoke', () => {
  let handle: StoreHandle;

  beforeEach(async () => {
    handle = await openStore();
  });

  afterEach(async () => {
    await handle.close();
  });

  it('exposes the package.json version', () => {
    expect(VERSION).toBe(pkgVersion);
  });

  it('auto-approves a $50 expense end-to-end without pausing', async () => {
    const result = await runApprovalDemo({
      amount: 50,
      submitter: 'alice',
      justification: 'team lunch',
      checkpointStore: handle.checkpoints,
      threadId: 'auto-50',
    });
    expect(result.status).toBe('completed');
    expect(result.suspendedAtNode).toBeUndefined();
    expect(result.finalState.approved).toBe(true);
    expect(result.finalState.reason).toMatch(/auto-approved/);
    expect(result.finalState.processedAt).toBeDefined();
    expect(result.finalState.notifications.length).toBeGreaterThan(0);
    const types = new Set(result.events.map((e) => e.type));
    expect(types.has('workflow.suspended')).toBe(false);
    expect(types.has('workflow.end')).toBe(true);
  });

  it('pauses a $500 expense at auto-approve-or-pause and survives a simulated server restart', async () => {
    const initial = await runApprovalDemo({
      amount: 500,
      submitter: 'bob',
      justification: 'engineering offsite travel',
      checkpointStore: handle.checkpoints,
      threadId: 'manual-500',
    });
    expect(initial.status).toBe('suspended');
    expect(initial.suspendedAtNode).toBe(NODE_NAMES.decide);
    expect(initial.finalState.approved).toBeUndefined();
    expect(initial.finalState.processedAt).toBeUndefined();

    const suspended = initial.events.find((e) => e.type === 'workflow.suspended');
    expect(suspended).toBeDefined();
    if (suspended?.type === 'workflow.suspended') {
      expect(suspended.value).toMatchObject({
        reason: 'manual-review',
        amount: 500,
        submitter: 'bob',
      });
    }

    const resumed = await simulateServerRestart({
      checkpointStore: handle.checkpoints,
      threadId: 'manual-500',
      directive: new Directive<Partial<ExpenseState>, ApprovalDecision>({
        resume: { approved: true, reason: 'OK' },
      }),
    });
    expect(resumed.status).toBe('completed');
    expect(resumed.finalState.approved).toBe(true);
    expect(resumed.finalState.reason).toBe('OK');
    expect(resumed.finalState.processedAt).toBeDefined();
    expect(resumed.finalState.notifications.length).toBeGreaterThan(0);
    expect(resumed.finalState.notifications.some((n) => n.includes('approved'))).toBe(true);
    const lastEvent = resumed.events[resumed.events.length - 1];
    expect(lastEvent?.type).toBe('workflow.end');
  });

  it('emits every documented WorkflowEvent tag across execute + resume', async () => {
    const initial = await runApprovalDemo({
      amount: 750,
      submitter: 'carol',
      checkpointStore: handle.checkpoints,
      threadId: 'events-750',
    });
    expect(initial.status).toBe('suspended');

    const resumed = await simulateServerRestart({
      checkpointStore: handle.checkpoints,
      threadId: 'events-750',
      directive: new Directive<Partial<ExpenseState>, ApprovalDecision>({
        resume: { approved: true, reason: 'OK' },
      }),
    });

    const seen = new Set<WorkflowEvent<ExpenseState>['type']>();
    for (const ev of [...initial.events, ...resumed.events]) {
      seen.add(ev.type);
    }
    for (const tag of REQUIRED_EVENT_TAGS) {
      expect(seen.has(tag), `expected event tag '${tag}' to appear at least once`).toBe(true);
    }
  });

  it('stream modes values / updates / tasks all complete on the auto-approve path', async () => {
    const wf = createApprovalWorkflow({ checkpointStore: handle.checkpoints });
    for (const mode of ['values', 'updates', 'tasks'] as const) {
      const events = await collect(
        wf.execute(
          { amount: 25, submitter: `op-${mode}`, justification: 'coffee' },
          { threadId: `mode-${mode}`, stream: mode },
        ),
      );
      expect(events.length).toBeGreaterThan(0);
      const last = events[events.length - 1];
      expect(['workflow.end', 'workflow.step.end', 'workflow.task.end']).toContain(last?.type);
      const errored = events.find((e) => e.type === 'workflow.error');
      expect(errored).toBeUndefined();
    }
  });

  it('Directive(resume) payload is observable on the resume.value event and final state', async () => {
    const initial = await runApprovalDemo({
      amount: 200,
      submitter: 'dan',
      checkpointStore: handle.checkpoints,
      threadId: 'directive-200',
    });
    expect(initial.status).toBe('suspended');

    const resumed = await simulateServerRestart({
      checkpointStore: handle.checkpoints,
      threadId: 'directive-200',
      directive: new Directive<Partial<ExpenseState>, ApprovalDecision>({
        resume: { approved: true, reason: 'OK' },
      }),
    });
    expect(resumed.finalState.approved).toBe(true);
    expect(resumed.finalState.reason).toBe('OK');
    expect(resumed.events[0]?.type).toBe('workflow.resumed');
  });

  it('settlement stage - timer parks with wakeAt, tick fires it, awakeable parks, resolveAwakeable delivers the value', async () => {
    const wf = createSettlementWorkflow({ checkpointStore: handle.checkpoints });
    const events = (await collect(
      wf.execute({ batchId: 'batch-q3' }, { threadId: 'settle-manual', stream: 'debug' }),
    )) as ReadonlyArray<WorkflowEvent<SettlementState>>;

    // 1. sleepFor(...) parked the thread: checkpoint suspended with a
    //    persisted wakeAt (exposed on the pendingPauses frontier set and
    //    stamped on the checkpoint row the timer driver polls).
    const parked = await wf.getState('settle-manual');
    expect(parked.status).toBe('suspended');
    expect(parked.pendingPause?.nodeName).toBe(SETTLEMENT_NODE_NAMES.hold);
    const wakeAt = parked.pendingPauses?.[0]?.wakeAt;
    if (wakeAt === undefined) throw new Error('expected a persisted wakeAt on the timer pause');
    const suspendedEvent = events.find((e) => e.type === 'workflow.suspended');
    expect(suspendedEvent?.type).toBe('workflow.suspended');
    if (suspendedEvent?.type === 'workflow.suspended') {
      expect(isTimerPauseValue(suspendedEvent.value)).toBe(true);
      if (isTimerPauseValue(suspendedEvent.value)) {
        expect(suspendedEvent.value.wakeAt).toBe(wakeAt);
      }
    }
    const due = await handle.checkpoints.listSuspended?.(
      namespaceFor({ name: 'expense-settlement' }),
      { dueBefore: wakeAt + 1 },
    );
    expect(due).toEqual([{ threadId: 'settle-manual', wakeAt }]);

    // 2. An early tick is a no-op that reports the pending deadline; a
    //    due tick fires the timer and the thread re-parks on the awakeable.
    const early = await wf.tick('settle-manual', { now: wakeAt - 1 });
    expect(early).toEqual({ fired: false, nextWakeAt: wakeAt });
    const fired = await wf.tick('settle-manual', { now: wakeAt + 1 });
    expect(fired.fired).toBe(true);
    expect(fired.nextWakeAt).toBeNull();
    const awaiting = await wf.getState('settle-manual');
    expect(awaiting.status).toBe('suspended');
    expect(awaiting.pendingPauses?.[0]?.name).toBe(SETTLEMENT_AWAKEABLE);
    expect(awaiting.pendingPauses?.[0]?.wakeAt).toBeUndefined();

    // 3. resolveAwakeable delivers the confirmation into the node result
    //    and the workflow runs archive-batch to completion.
    const resolveEvents = (await collect(
      wf.resolveAwakeable('settle-manual', SETTLEMENT_AWAKEABLE, {
        confirmedBy: 'qa-finance',
        reference: 'SET-TEST-0001',
      }),
    )) as ReadonlyArray<WorkflowEvent<SettlementState>>;
    expect(resolveEvents[resolveEvents.length - 1]?.type).toBe('workflow.end');
    const done = await wf.getState('settle-manual');
    expect(done.status).toBe('completed');
    expect(done.state.confirmedBy).toBe('qa-finance');
    expect(done.state.reference).toBe('SET-TEST-0001');
    expect(done.state.settledAt).toBeDefined();
    expect(done.state.log.some((line) => line.includes('SET-TEST-0001'))).toBe(true);
    expect(done.state.log.some((line) => line.includes('archived'))).toBe(true);
  });

  it('settlement stage - CLI helpers drive createTimerDriver end-to-end across fresh Workflow instances', async () => {
    const started = await runSettlementDemo({
      batchId: 'batch-e2e',
      checkpointStore: handle.checkpoints,
      threadId: 'settle-e2e',
    });
    expect(started.status).toBe('suspended');
    expect(started.suspendedAtNode).toBe(SETTLEMENT_NODE_NAMES.hold);
    expect(typeof started.wakeAt).toBe('number');

    // Real driver sweep loop: waits out the short SETTLEMENT_HOLD_MS
    // timer against the SQLite store's listSuspended enumeration.
    const ticked = await fireSettlementTimer({
      checkpointStore: handle.checkpoints,
      threadId: 'settle-e2e',
    });
    expect(ticked.fired).toBe(1);
    expect(ticked.sweeps).toBeGreaterThanOrEqual(1);
    expect(ticked.status).toBe('suspended');
    expect(ticked.awakeableName).toBe(SETTLEMENT_AWAKEABLE);

    const confirmed = await confirmSettlement({
      checkpointStore: handle.checkpoints,
      threadId: 'settle-e2e',
      confirmation: { confirmedBy: 'qa-finance', reference: 'SET-TEST-0002' },
    });
    expect(confirmed.status).toBe('completed');
    expect(confirmed.finalState.confirmedBy).toBe('qa-finance');
    expect(confirmed.finalState.reference).toBe('SET-TEST-0002');
    expect(confirmed.finalState.log.length).toBeGreaterThanOrEqual(2);
    expect(confirmed.events[confirmed.events.length - 1]?.type).toBe('workflow.end');
  });
});
