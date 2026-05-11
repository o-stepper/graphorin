/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Workflow HITL durable-resume acceptance demo — library mode. Wires
 * `@graphorin/workflow`'s step-graph engine to a four-node expense-
 * approval pipeline (`receive` → `auto-approve-or-pause` → `process-
 * approved` → `notify`). The middle node either fast-paths small
 * expenses or calls `pause({ reason: 'manual-review', ... })` to
 * suspend; a fresh `Workflow` instance built on the same SQLite
 * `CheckpointStore` resumes the paused thread with
 * `new Directive({ resume: { approved, reason } })`, demonstrating
 * that workflow state survives a simulated server restart end-to-end.
 *
 * Exports `createApprovalWorkflow(...)` (the typed `Workflow` factory),
 * `runApprovalDemo(...)` (executes a single submission and reports
 * whether it auto-approved or paused), and `simulateServerRestart(...)`
 * (rebuilds the workflow from the persisted checkpoint and resumes the
 * paused thread). The CLI entry point exercises both the auto-approve
 * ($50) and manual-review ($500) flows and prints a one-line summary
 * for each.
 */

import process from 'node:process';
import { type CheckpointStore, collect, Directive, type WorkflowEvent } from '@graphorin/core';
import { optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import {
  createNode,
  createWorkflow,
  latestValue,
  pause,
  reducer,
  type StreamMode,
  type Workflow,
} from '@graphorin/workflow';
import {
  type ApprovalDecision,
  AUTO_APPROVE_THRESHOLD,
  type ExpenseInput,
  type ExpenseState,
  type ManualReviewPause,
  NODE_NAMES,
} from './types.js';

/** Canonical version constant — must mirror `package.json`. */
export const VERSION = '0.1.0';

/** Default stream mode used by every helper unless explicitly overridden. */
const DEFAULT_STREAM_MODE: StreamMode = 'debug';

/** Inputs accepted by {@link createApprovalWorkflow}. */
export interface CreateApprovalWorkflowOptions {
  readonly checkpointStore: CheckpointStore;
}

/**
 * Build the four-node approval workflow. Always returns a fresh
 * `Workflow` instance; pair the same `checkpointStore` argument across
 * multiple calls to demonstrate durable resume.
 */
export function createApprovalWorkflow(
  options: CreateApprovalWorkflowOptions,
): Workflow<ExpenseState, ExpenseInput> {
  const { checkpointStore } = options;
  const tracer = optionalTracerFromEnv(process.env);
  return createWorkflow<ExpenseState, ExpenseInput>({
    name: 'expense-approval',
    channels: {
      amount: latestValue<number>({ default: 0 }),
      submitter: latestValue<string>({ default: '' }),
      justification: latestValue<ExpenseState['justification']>(),
      approved: latestValue<ExpenseState['approved']>(),
      reason: latestValue<ExpenseState['reason']>(),
      processedAt: latestValue<ExpenseState['processedAt']>(),
      notifications: reducer<ReadonlyArray<string>>((prev, next) => [...prev, ...next], {
        default: [],
      }),
    },
    nodes: {
      [NODE_NAMES.receive]: createNode<ExpenseState>({
        name: NODE_NAMES.receive,
        run: (state, ctx) => {
          ctx.emit('expense.received', {
            amount: state.amount,
            submitter: state.submitter,
          });
          return {
            notifications: [
              `received expense=$${state.amount} from ${state.submitter}` +
                (state.justification !== undefined ? ` (${state.justification})` : ''),
            ],
          };
        },
      }),
      [NODE_NAMES.decide]: createNode<ExpenseState>({
        name: NODE_NAMES.decide,
        run: (state, ctx) => {
          if (state.amount < AUTO_APPROVE_THRESHOLD) {
            ctx.emit('decision.auto-approved', { amount: state.amount });
            return {
              approved: true,
              reason: `auto-approved (amount $${state.amount} < $${AUTO_APPROVE_THRESHOLD} threshold)`,
              notifications: [`auto-approved $${state.amount} for ${state.submitter}`],
            };
          }
          const decision = pause<ManualReviewPause, ApprovalDecision>({
            reason: 'manual-review',
            amount: state.amount,
            submitter: state.submitter,
          });
          ctx.emit('decision.manual-review-resumed', { decision });
          return {
            approved: decision.approved,
            reason: decision.reason,
            notifications: [
              `manual-review decision recorded for ${state.submitter}: ` +
                `${decision.approved ? 'approved' : 'rejected'} (${decision.reason})`,
            ],
          };
        },
      }),
      [NODE_NAMES.process]: createNode<ExpenseState>({
        name: NODE_NAMES.process,
        run: (state, ctx) => {
          if (state.approved !== true) {
            return {
              notifications: [
                `skipped processing for ${state.submitter} — decision was not approved`,
              ],
            };
          }
          const processedAt = new Date().toISOString();
          ctx.emit('expense.processed', { processedAt, amount: state.amount });
          return {
            processedAt,
            notifications: [`processed approved expense $${state.amount} at ${processedAt}`],
          };
        },
      }),
      [NODE_NAMES.notify]: createNode<ExpenseState>({
        name: NODE_NAMES.notify,
        run: (state, ctx) => {
          ctx.emit('notification.sent', {
            submitter: state.submitter,
            approved: state.approved ?? false,
          });
          return {
            notifications: [
              `notify(${state.submitter}): approved=${state.approved ?? false}, ` +
                `reason='${state.reason ?? 'n/a'}', processedAt=${state.processedAt ?? 'n/a'}`,
            ],
          };
        },
      }),
    },
    edges: [
      { from: '__start__', to: NODE_NAMES.receive },
      { from: NODE_NAMES.receive, to: NODE_NAMES.decide },
      { from: NODE_NAMES.decide, to: NODE_NAMES.process },
      { from: NODE_NAMES.process, to: NODE_NAMES.notify },
      { from: NODE_NAMES.notify, to: '__end__' },
    ],
    checkpointStore,
    ...(tracer !== undefined ? { tracer } : {}),
  });
}

/** Inputs accepted by {@link runApprovalDemo}. */
export interface RunApprovalDemoOptions {
  readonly amount: number;
  readonly submitter: string;
  readonly justification?: string;
  readonly checkpointStore: CheckpointStore;
  readonly threadId: string;
  /** Stream emission mode — defaults to `'debug'` (every event kind). */
  readonly stream?: StreamMode;
  readonly signal?: AbortSignal;
}

/** Result returned by {@link runApprovalDemo}. */
export interface RunApprovalDemoResult {
  readonly events: ReadonlyArray<WorkflowEvent<ExpenseState>>;
  readonly finalState: ExpenseState;
  readonly status: 'completed' | 'suspended' | 'running' | 'failed';
  readonly suspendedAtNode?: string;
  readonly threadId: string;
}

/**
 * Run a single expense submission through the approval workflow.
 * Returns the collected event stream, the latest checkpointed state,
 * and (when the workflow paused for manual review) the node that
 * suspended.
 */
export async function runApprovalDemo(
  options: RunApprovalDemoOptions,
): Promise<RunApprovalDemoResult> {
  const wf = createApprovalWorkflow({ checkpointStore: options.checkpointStore });
  const input: ExpenseInput = {
    amount: options.amount,
    submitter: options.submitter,
    ...(options.justification !== undefined ? { justification: options.justification } : {}),
  };
  const events = (await collect(
    wf.execute(input, {
      threadId: options.threadId,
      stream: options.stream ?? DEFAULT_STREAM_MODE,
      ...(options.signal !== undefined ? { signal: options.signal } : {}),
    }),
  )) as ReadonlyArray<WorkflowEvent<ExpenseState>>;
  const snapshot = await wf.getState(options.threadId);
  return {
    events,
    finalState: snapshot.state,
    status: snapshot.status,
    threadId: options.threadId,
    ...(snapshot.pendingPause !== undefined
      ? { suspendedAtNode: snapshot.pendingPause.nodeName }
      : {}),
  };
}

/** Inputs accepted by {@link simulateServerRestart}. */
export interface SimulateServerRestartOptions {
  readonly checkpointStore: CheckpointStore;
  readonly threadId: string;
  readonly directive: Directive<Partial<ExpenseState>, ApprovalDecision>;
  readonly stream?: StreamMode;
  readonly signal?: AbortSignal;
}

/** Result returned by {@link simulateServerRestart}. */
export interface SimulateServerRestartResult {
  readonly events: ReadonlyArray<WorkflowEvent<ExpenseState>>;
  readonly finalState: ExpenseState;
  readonly status: 'completed' | 'suspended' | 'running' | 'failed';
  readonly threadId: string;
}

/**
 * Rebuild a brand-new `Workflow` instance from the supplied persistent
 * `CheckpointStore` and resume the paused thread with the operator's
 * directive. Because the previous in-process workflow handle is
 * discarded, this is byte-equivalent to a server restart mid-pause —
 * everything needed to continue lives in the checkpoint store.
 */
export async function simulateServerRestart(
  options: SimulateServerRestartOptions,
): Promise<SimulateServerRestartResult> {
  const wf = createApprovalWorkflow({ checkpointStore: options.checkpointStore });
  const events = (await collect(
    wf.resume(options.threadId, options.directive, {
      stream: options.stream ?? DEFAULT_STREAM_MODE,
      ...(options.signal !== undefined ? { signal: options.signal } : {}),
    }),
  )) as ReadonlyArray<WorkflowEvent<ExpenseState>>;
  const snapshot = await wf.getState(options.threadId);
  return {
    events,
    finalState: snapshot.state,
    status: snapshot.status,
    threadId: options.threadId,
  };
}

/**
 * Open a fresh `:memory:` SQLite-backed checkpoint store. The CLI
 * entry point uses this; tests typically supply their own already-
 * initialised store (e.g. file-backed) and share it across the
 * simulated restart boundary.
 */
export async function openMemoryCheckpointStore(): Promise<{
  readonly store: GraphorinSqliteStore;
  readonly checkpoints: CheckpointStore;
  close(): Promise<void>;
}> {
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

/**
 * CLI entry point. Runs both the auto-approve ($50) and the manual-
 * review ($500) flows against an in-memory SQLite store; for the
 * manual-review flow the helper additionally simulates a server
 * restart by discarding the in-flight workflow handle and resuming
 * from the persisted checkpoint with a fresh `Workflow` instance.
 */
export async function main(): Promise<number> {
  const handle = await openMemoryCheckpointStore();
  try {
    const auto = await runApprovalDemo({
      amount: 50,
      submitter: 'alice',
      justification: 'team lunch',
      checkpointStore: handle.checkpoints,
      threadId: 'demo-auto-approve',
    });
    process.stdout.write(
      `graphorin v${VERSION} approval-workflow auto — ` +
        `status=${auto.status}, approved=${auto.finalState.approved ?? false}, ` +
        `notifications=${auto.finalState.notifications.length}.\n`,
    );

    const initial = await runApprovalDemo({
      amount: 500,
      submitter: 'bob',
      justification: 'engineering offsite travel',
      checkpointStore: handle.checkpoints,
      threadId: 'demo-manual-review',
    });
    process.stdout.write(
      `graphorin v${VERSION} approval-workflow manual — ` +
        `status=${initial.status}, suspendedAtNode='${initial.suspendedAtNode ?? '<none>'}'.\n`,
    );

    if (initial.status === 'suspended') {
      const resumed = await simulateServerRestart({
        checkpointStore: handle.checkpoints,
        threadId: initial.threadId,
        directive: new Directive<Partial<ExpenseState>, ApprovalDecision>({
          resume: { approved: true, reason: 'OK' },
        }),
      });
      process.stdout.write(
        `graphorin v${VERSION} approval-workflow resume — ` +
          `status=${resumed.status}, approved=${resumed.finalState.approved ?? false}, ` +
          `processedAt='${resumed.finalState.processedAt ?? '<none>'}', ` +
          `notifications=${resumed.finalState.notifications.length}.\n`,
      );
    }
    return 0;
  } finally {
    await handle.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
