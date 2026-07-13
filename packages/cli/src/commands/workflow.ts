/**
 * `graphorin workflow` - inspect durable workflow threads (E2, item 16
 * tail).
 *
 *  - `graphorin workflow inspect <threadId>` - the latest checkpoint of
 *    one thread: status, step, pending pauses (timers / awakeables /
 *    approvals with their deadlines) and the persisted channel state.
 *  - `graphorin workflow checkpoints <threadId>` - every persisted
 *    checkpoint of the thread, oldest to newest as the store yields
 *    them.
 *
 * Both commands read the checkpoint store directly (the CLI has no
 * node graph to rebuild a `Workflow` handle from), keyed by the
 * workflow NAME via `--workflow` - the same namespace derivation
 * `createWorkflow` uses, through the shared read-only helpers
 * `readThreadState` / `listThreadCheckpoints` in `@graphorin/workflow`.
 *
 * @packageDocumentation
 */

import {
  listThreadCheckpoints,
  readThreadState,
  type ThreadCheckpointSummary,
  type ThreadInspection,
} from '@graphorin/workflow';

import { EXIT_CODES } from '../internal/exit.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';
import { openStoreContext } from '../internal/store-context.js';

/** @stable */
export interface WorkflowCommonOptions extends CommonOutputOptions {
  readonly config?: string;
  /** Workflow NAME the thread belongs to (derives the checkpoint namespace). */
  readonly workflow: string;
  readonly threadId: string;
}

function markFor(status: string): string {
  if (status === 'failed' || status === 'aborted') return statusMarker('fail');
  if (status === 'suspended') return statusMarker('warn');
  if (status === 'completed') return statusMarker('ok');
  return statusMarker('info');
}

/** @stable */
export async function runWorkflowInspect(
  options: WorkflowCommonOptions,
): Promise<ThreadInspection | null> {
  const ctx = await openStoreContext({
    // Read-only command - never auto-migrate a live database (W-068).
    migrationPolicy: 'check',
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const snapshot = await readThreadState(
      ctx.store.checkpoints,
      options.workflow,
      options.threadId,
    );
    emitReport(options, snapshot, () => {
      const print = options.print ?? defaultPrintSink;
      if (snapshot === null) {
        print(
          brand(
            `thread '${options.threadId}' not found under workflow '${options.workflow}' ` +
              `(namespace workflow/${options.workflow}).`,
          ),
        );
        return;
      }
      print(brand(`thread ${snapshot.threadId} (workflow=${snapshot.workflowName})`));
      print(`  ${markFor(snapshot.status)} status: ${snapshot.status}`);
      print(`  stepNumber: ${snapshot.stepNumber}`);
      print(`  checkpointId: ${snapshot.checkpointId}`);
      print(`  createdAt: ${snapshot.createdAt}`);
      if (snapshot.nodeName !== undefined) print(`  nodeName: ${snapshot.nodeName}`);
      if (snapshot.pendingPauses.length > 0) {
        print(`  pending pauses (${snapshot.pendingPauses.length}):`);
        for (const pause of snapshot.pendingPauses) {
          const wake =
            typeof pause.wakeAt === 'number' ? new Date(pause.wakeAt).toISOString() : '-';
          print(`    - node=${pause.nodeName} name=${pause.name ?? '-'} wakeAt=${wake}`);
        }
      }
      const stateKeys =
        typeof snapshot.state === 'object' && snapshot.state !== null
          ? Object.keys(snapshot.state as Record<string, unknown>)
          : [];
      print(`  state keys: ${stateKeys.length > 0 ? stateKeys.join(', ') : '(none)'}`);
    });
    // W-002: exit code independent of --json.
    if (snapshot === null) process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
    return snapshot;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export async function runWorkflowCheckpoints(
  options: WorkflowCommonOptions,
): Promise<ReadonlyArray<ThreadCheckpointSummary>> {
  const ctx = await openStoreContext({
    // Read-only command - never auto-migrate a live database (W-068).
    migrationPolicy: 'check',
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const rows = await listThreadCheckpoints(
      ctx.store.checkpoints,
      options.workflow,
      options.threadId,
    );
    emitReport(options, rows, () => {
      const print = options.print ?? defaultPrintSink;
      if (rows.length === 0) {
        print(
          brand(
            `no checkpoints for thread '${options.threadId}' under workflow ` +
              `'${options.workflow}'.`,
          ),
        );
        return;
      }
      print(brand(`${rows.length} checkpoint(s) for thread ${options.threadId}:`));
      for (const row of rows) {
        const status = row.status ?? '-';
        print(
          `  ${markFor(status)} ${row.checkpointId} (step=${row.stepNumber}, status=${status}, ` +
            `node=${row.nodeName ?? '-'}, at=${row.createdAt})`,
        );
      }
    });
    if (rows.length === 0) process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
    return rows;
  } finally {
    await ctx.close();
  }
}
