/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Workflow HITL durable-resume acceptance demo - library mode. Wires
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
 *
 * A companion `expense-settlement` workflow showcases the remaining
 * durable primitives on the same pause substrate: `sleepFor(...)`
 * parks the thread on a durable timer (persisted `wakeAt`, fired by
 * `workflow.tick` via `createTimerDriver`), then `awaitExternal(...)`
 * parks it on a named awakeable resolved by
 * `workflow.resolveAwakeable(threadId, name, value)`. Each stage runs
 * on a fresh `Workflow` instance rebuilt from the same SQLite store,
 * so both primitives cross the simulated-restart boundary too.
 */

import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { type CheckpointStore, collect, Directive, type WorkflowEvent } from '@graphorin/core';
import { isMainModule, optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import {
  awaitExternal,
  createNode,
  createTimerDriver,
  createWorkflow,
  latestValue,
  type PendingPauseRecord,
  pause,
  reducer,
  type StreamMode,
  sleepFor,
  type Workflow,
} from '@graphorin/workflow';
/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };
import {
  type ApprovalDecision,
  AUTO_APPROVE_THRESHOLD,
  type ExpenseInput,
  type ExpenseState,
  type ManualReviewPause,
  NODE_NAMES,
  SETTLEMENT_AWAKEABLE,
  SETTLEMENT_HOLD_MS,
  SETTLEMENT_NODE_NAMES,
  type SettlementConfirmation,
  type SettlementInput,
  type SettlementState,
} from './types.js';

export const VERSION: string = pkg.version;

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
                `skipped processing for ${state.submitter} - decision was not approved`,
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
  /** Stream emission mode - defaults to `'debug'` (every event kind). */
  readonly stream?: StreamMode;
  readonly signal?: AbortSignal;
}

/** Result returned by {@link runApprovalDemo}. */
export interface RunApprovalDemoResult {
  readonly events: ReadonlyArray<WorkflowEvent<ExpenseState>>;
  readonly finalState: ExpenseState;
  readonly status: 'completed' | 'suspended' | 'running' | 'failed' | 'aborted';
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
  readonly status: 'completed' | 'suspended' | 'running' | 'failed' | 'aborted';
  readonly threadId: string;
}

/**
 * Rebuild a brand-new `Workflow` instance from the supplied persistent
 * `CheckpointStore` and resume the paused thread with the operator's
 * directive. Because the previous in-process workflow handle is
 * discarded, this is byte-equivalent to a server restart mid-pause -
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
 * Build the two-node settlement workflow - the durable-primitives
 * stage. The `hold-for-settlement` node calls `sleepFor(...)` (a
 * durable timer: the thread suspends with a persisted `wakeAt`) and
 * then `awaitExternal(...)` (an awakeable: the thread suspends under a
 * name until an external system resolves it with a value). Both
 * suspensions live in the checkpointed frontier - exactly like the
 * approval pause, they survive process restarts and fresh `Workflow`
 * instances built on the same `checkpointStore`.
 */
export function createSettlementWorkflow(
  options: CreateApprovalWorkflowOptions,
): Workflow<SettlementState, SettlementInput> {
  const { checkpointStore } = options;
  const tracer = optionalTracerFromEnv(process.env);
  return createWorkflow<SettlementState, SettlementInput>({
    name: 'expense-settlement',
    channels: {
      batchId: latestValue<string>({ default: '' }),
      settledAt: latestValue<SettlementState['settledAt']>(),
      confirmedBy: latestValue<SettlementState['confirmedBy']>(),
      reference: latestValue<SettlementState['reference']>(),
      log: reducer<ReadonlyArray<string>>((prev, next) => [...prev, ...next], {
        default: [],
      }),
    },
    nodes: {
      [SETTLEMENT_NODE_NAMES.hold]: createNode<SettlementState>({
        name: SETTLEMENT_NODE_NAMES.hold,
        run: (state, ctx) => {
          // Durable timer: suspends with wakeAt = now + SETTLEMENT_HOLD_MS
          // persisted on the checkpoint. `workflow.tick(threadId)` - here
          // driven by `createTimerDriver` - resumes the thread once due.
          sleepFor(SETTLEMENT_HOLD_MS);
          // Awakeable (durable promise): suspends under a name until an
          // external system calls `workflow.resolveAwakeable(threadId,
          // name, value)`; that value is returned here. On each resume the
          // body re-executes from the top and the already-satisfied timer
          // pause replays its delivered value in order (WF-2).
          const confirmation = awaitExternal<SettlementConfirmation>(SETTLEMENT_AWAKEABLE);
          // Runs exactly once: every earlier pass threw a PauseSignal above.
          ctx.emit('settlement.confirmed', { batchId: state.batchId, ...confirmation });
          return {
            settledAt: new Date().toISOString(),
            confirmedBy: confirmation.confirmedBy,
            reference: confirmation.reference,
            log: [
              `settlement window closed for ${state.batchId}; ` +
                `confirmation ${confirmation.reference} from ${confirmation.confirmedBy}`,
            ],
          };
        },
      }),
      [SETTLEMENT_NODE_NAMES.archive]: createNode<SettlementState>({
        name: SETTLEMENT_NODE_NAMES.archive,
        run: (state) => ({
          log: [
            `archived settled batch ${state.batchId} ` +
              `(settledAt=${state.settledAt ?? 'n/a'}, reference=${state.reference ?? 'n/a'})`,
          ],
        }),
      }),
    },
    edges: [
      { from: '__start__', to: SETTLEMENT_NODE_NAMES.hold },
      { from: SETTLEMENT_NODE_NAMES.hold, to: SETTLEMENT_NODE_NAMES.archive },
      { from: SETTLEMENT_NODE_NAMES.archive, to: '__end__' },
    ],
    checkpointStore,
    ...(tracer !== undefined ? { tracer } : {}),
  });
}

/**
 * First persisted durable-timer deadline on a suspended thread, if
 * any. D1 detail: `WorkflowState.pendingPause` is the legacy compat
 * record (node name + pause value only); the timer's `wakeAt` and the
 * awakeable's `name` ride the FULL `pendingPauses` frontier set.
 */
function pendingTimerWakeAt(
  pauses: ReadonlyArray<PendingPauseRecord> | undefined,
): number | undefined {
  return pauses?.find((p) => typeof p.wakeAt === 'number')?.wakeAt;
}

/** First pending awakeable/approval name on a suspended thread, if any. */
function pendingAwakeableName(
  pauses: ReadonlyArray<PendingPauseRecord> | undefined,
): string | undefined {
  return pauses?.find((p) => typeof p.name === 'string')?.name;
}

/** Inputs accepted by {@link runSettlementDemo}. */
export interface RunSettlementDemoOptions {
  readonly batchId: string;
  readonly checkpointStore: CheckpointStore;
  readonly threadId: string;
  /** Stream emission mode - defaults to `'debug'` (every event kind). */
  readonly stream?: StreamMode;
  readonly signal?: AbortSignal;
}

/** Result returned by {@link runSettlementDemo}. */
export interface RunSettlementDemoResult {
  readonly events: ReadonlyArray<WorkflowEvent<SettlementState>>;
  readonly finalState: SettlementState;
  readonly status: 'completed' | 'suspended' | 'running' | 'failed' | 'aborted';
  readonly threadId: string;
  /** Node holding the thread while the durable timer is pending. */
  readonly suspendedAtNode?: string;
  /** Epoch ms at which the persisted durable timer becomes due. */
  readonly wakeAt?: number;
}

/**
 * Start a settlement batch. The `hold-for-settlement` node immediately
 * parks the thread on a durable timer, so the returned snapshot is
 * `status='suspended'` with the persisted `wakeAt` exposed - the CLI
 * prints it, and {@link fireSettlementTimer} fires it.
 */
export async function runSettlementDemo(
  options: RunSettlementDemoOptions,
): Promise<RunSettlementDemoResult> {
  const wf = createSettlementWorkflow({ checkpointStore: options.checkpointStore });
  const events = (await collect(
    wf.execute(
      { batchId: options.batchId },
      {
        threadId: options.threadId,
        stream: options.stream ?? DEFAULT_STREAM_MODE,
        ...(options.signal !== undefined ? { signal: options.signal } : {}),
      },
    ),
  )) as ReadonlyArray<WorkflowEvent<SettlementState>>;
  const snapshot = await wf.getState(options.threadId);
  const wakeAt = pendingTimerWakeAt(snapshot.pendingPauses);
  return {
    events,
    finalState: snapshot.state,
    status: snapshot.status,
    threadId: options.threadId,
    ...(snapshot.pendingPause !== undefined
      ? { suspendedAtNode: snapshot.pendingPause.nodeName }
      : {}),
    ...(wakeAt !== undefined ? { wakeAt } : {}),
  };
}

/** Pause between timer-driver sweeps while the demo waits out the hold. */
const SWEEP_PAUSE_MS = 20;

/** Default wall-clock budget for the sweep loop - fail loudly, never hang. */
const DEFAULT_SWEEP_BUDGET_MS = 5_000;

/** Inputs accepted by {@link fireSettlementTimer}. */
export interface FireSettlementTimerOptions {
  readonly checkpointStore: CheckpointStore;
  readonly threadId: string;
  /** Wall-clock budget for the sweep loop (ms). Default 5000. */
  readonly sweepBudgetMs?: number;
}

/** Result returned by {@link fireSettlementTimer}. */
export interface FireSettlementTimerResult {
  /** Timers fired across all sweeps (1 for the demo's single thread). */
  readonly fired: number;
  /** Driver sweeps taken until the timer came due. */
  readonly sweeps: number;
  readonly status: 'completed' | 'suspended' | 'running' | 'failed' | 'aborted';
  readonly threadId: string;
  /** Name of the awakeable now holding the thread (when suspended on one). */
  readonly awakeableName?: string;
}

/**
 * Fire the pending durable timer through `createTimerDriver` - the
 * same poll loop a production deployment runs: the store enumerates
 * due suspended threads (`CheckpointStore.listSuspended`, stamped by
 * the engine's `metadata.wakeAt`) and the driver resumes them via
 * `workflow.tick(threadId)`. The demo paces the driver manually with
 * `driver.sweep()` instead of `start()`'s background interval so the
 * CLI stays deterministic and exits promptly. The `Workflow` instance
 * is rebuilt from the checkpoint store, so the timer crosses the same
 * simulated-restart boundary as the approval pause.
 */
export async function fireSettlementTimer(
  options: FireSettlementTimerOptions,
): Promise<FireSettlementTimerResult> {
  const wf = createSettlementWorkflow({ checkpointStore: options.checkpointStore });
  const driver = createTimerDriver({
    workflows: [{ workflow: wf, checkpointStore: options.checkpointStore }],
    pollIntervalMs: SWEEP_PAUSE_MS,
  });
  const budgetMs = options.sweepBudgetMs ?? DEFAULT_SWEEP_BUDGET_MS;
  const deadline = Date.now() + budgetMs;
  let fired = 0;
  let sweeps = 0;
  for (;;) {
    fired += await driver.sweep();
    sweeps += 1;
    const snapshot = await wf.getState(options.threadId);
    if (pendingTimerWakeAt(snapshot.pendingPauses) === undefined) {
      // No timer pause is pending any more: the due timer fired and the
      // thread moved on (for this demo: re-parked on the awakeable).
      const awakeableName = pendingAwakeableName(snapshot.pendingPauses);
      return {
        fired,
        sweeps,
        status: snapshot.status,
        threadId: options.threadId,
        ...(awakeableName !== undefined ? { awakeableName } : {}),
      };
    }
    if (Date.now() >= deadline) {
      throw new Error(
        `settlement timer did not fire within ${budgetMs}ms (${sweeps} driver sweeps)`,
      );
    }
    await delay(SWEEP_PAUSE_MS);
  }
}

/** Inputs accepted by {@link confirmSettlement}. */
export interface ConfirmSettlementOptions {
  readonly checkpointStore: CheckpointStore;
  readonly threadId: string;
  /** Payload the external payment provider delivers to the awakeable. */
  readonly confirmation: SettlementConfirmation;
  readonly stream?: StreamMode;
  readonly signal?: AbortSignal;
}

/** Result returned by {@link confirmSettlement}. */
export interface ConfirmSettlementResult {
  readonly events: ReadonlyArray<WorkflowEvent<SettlementState>>;
  readonly finalState: SettlementState;
  readonly status: 'completed' | 'suspended' | 'running' | 'failed' | 'aborted';
  readonly threadId: string;
}

/**
 * Resolve the named awakeable: `workflow.resolveAwakeable(threadId,
 * SETTLEMENT_AWAKEABLE, confirmation)` re-enters the held node so the
 * suspended `awaitExternal(...)` call returns the confirmation, then
 * the workflow runs `archive-batch` to completion. Built on a fresh
 * `Workflow` instance - the awakeable, like the timer, lives entirely
 * in the checkpoint store.
 */
export async function confirmSettlement(
  options: ConfirmSettlementOptions,
): Promise<ConfirmSettlementResult> {
  const wf = createSettlementWorkflow({ checkpointStore: options.checkpointStore });
  const events = (await collect(
    wf.resolveAwakeable(options.threadId, SETTLEMENT_AWAKEABLE, options.confirmation, {
      stream: options.stream ?? DEFAULT_STREAM_MODE,
      ...(options.signal !== undefined ? { signal: options.signal } : {}),
    }),
  )) as ReadonlyArray<WorkflowEvent<SettlementState>>;
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
 * Finally the durable-primitives stage settles a batch: park on a
 * durable timer (persisted `wakeAt`), fire it via `createTimerDriver`
 * sweeps, park on the named awakeable, and resolve it with
 * `workflow.resolveAwakeable(...)` - one printed line per milestone.
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
      `graphorin v${VERSION} approval-workflow auto - ` +
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
      `graphorin v${VERSION} approval-workflow manual - ` +
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
        `graphorin v${VERSION} approval-workflow resume - ` +
          `status=${resumed.status}, approved=${resumed.finalState.approved ?? false}, ` +
          `processedAt='${resumed.finalState.processedAt ?? '<none>'}', ` +
          `notifications=${resumed.finalState.notifications.length}.\n`,
      );
    }

    const settle = await runSettlementDemo({
      batchId: 'expenses-2026-07',
      checkpointStore: handle.checkpoints,
      threadId: 'demo-settlement',
    });
    process.stdout.write(
      `graphorin v${VERSION} approval-workflow settle - parked on durable timer, ` +
        `status=${settle.status}, node='${settle.suspendedAtNode ?? '<none>'}', ` +
        `wakeAt=${settle.wakeAt !== undefined ? new Date(settle.wakeAt).toISOString() : '<none>'}.\n`,
    );

    const ticked = await fireSettlementTimer({
      checkpointStore: handle.checkpoints,
      threadId: settle.threadId,
    });
    process.stdout.write(
      `graphorin v${VERSION} approval-workflow settle - durable timer fired via tick, ` +
        `fired=${ticked.fired}, sweeps=${ticked.sweeps}.\n`,
    );
    process.stdout.write(
      `graphorin v${VERSION} approval-workflow settle - parked on awakeable ` +
        `'${ticked.awakeableName ?? '<none>'}', status=${ticked.status}.\n`,
    );

    const confirmed = await confirmSettlement({
      checkpointStore: handle.checkpoints,
      threadId: settle.threadId,
      confirmation: { confirmedBy: 'finance-ops', reference: 'SET-2026-0117' },
    });
    process.stdout.write(
      `graphorin v${VERSION} approval-workflow settle - awakeable resolved, ` +
        `status=${confirmed.status}, confirmedBy=${confirmed.finalState.confirmedBy ?? '<none>'}, ` +
        `reference=${confirmed.finalState.reference ?? '<none>'}, log=${confirmed.finalState.log.length}.\n`,
    );

    if (confirmed.status !== 'completed' || confirmed.finalState.reference !== 'SET-2026-0117') {
      process.stderr.write('approval-workflow: durable-primitives stage did not complete.\n');
      return 1;
    }
    process.stdout.write(`graphorin v${VERSION} approval-workflow durable primitives: OK.\n`);
    return 0;
  } finally {
    await handle.close();
  }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
