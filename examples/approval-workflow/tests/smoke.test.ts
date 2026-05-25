/**
 * Graphorin v0.4.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
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
 */

import { type CheckpointStore, collect, Directive, type WorkflowEvent } from '@graphorin/core';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createApprovalWorkflow,
  runApprovalDemo,
  simulateServerRestart,
  VERSION,
} from '../src/main.js';
import { type ApprovalDecision, type ExpenseState, NODE_NAMES } from '../src/types.js';

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

describe('examples/approval-workflow — smoke', () => {
  let handle: StoreHandle;

  beforeEach(async () => {
    handle = await openStore();
  });

  afterEach(async () => {
    await handle.close();
  });

  it('exposes VERSION = 0.4.0', () => {
    expect(VERSION).toBe('0.4.0');
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
});
