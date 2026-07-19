/**
 * Read-only thread inspection over a bare `CheckpointStore`. A
 * `Workflow` handle bakes the namespace and the persisted
 * envelope/frontier parsing into `getState` / `listCheckpoints`, but an
 * operator surface (the `graphorin workflow` CLI) has no node graph to
 * rebuild the handle from - these helpers expose the SAME read path
 * keyed by the workflow NAME instead, so ad-hoc envelope parsing never
 * gets duplicated outside the engine.
 *
 * @packageDocumentation
 */

import type { CheckpointStore } from '@graphorin/core';

import { namespaceFor, readFrontier, unwrapPersistedState } from './internal/engine.js';
import type { PendingPauseRecord, WorkflowState } from './types.js';

/** Snapshot returned by {@link readThreadState}. @stable */
export interface ThreadInspection {
  readonly workflowName: string;
  readonly namespace: string;
  readonly threadId: string;
  readonly checkpointId: string;
  readonly stepNumber: number;
  readonly createdAt: string;
  readonly status: WorkflowState['status'];
  /** The unwrapped channel record persisted at the latest checkpoint. */
  readonly state: unknown;
  /** Node the run last stopped in, when the store recorded one. */
  readonly nodeName?: string;
  /** Full pending-pause frontier: timers (`wakeAt`), awakeables/approvals (`name`). */
  readonly pendingPauses: ReadonlyArray<PendingPauseRecord>;
}

/** One row of {@link listThreadCheckpoints}. @stable */
export interface ThreadCheckpointSummary {
  readonly checkpointId: string;
  readonly parentId?: string;
  readonly stepNumber: number;
  readonly createdAt: string;
  readonly status?: string;
  readonly nodeName?: string;
}

function coerceStatus(raw: string | undefined): WorkflowState['status'] {
  return raw === 'running' ||
    raw === 'suspended' ||
    raw === 'completed' ||
    raw === 'failed' ||
    raw === 'aborted'
    ? raw
    : 'running';
}

/**
 * Read the latest checkpoint of `threadId` under workflow
 * `workflowName` and decode it exactly like `Workflow.getState` does
 * (versioned state envelope + frontier tag). Returns `null` when the
 * thread does not exist in that namespace - an operator CLI reports
 * that instead of throwing.
 *
 * @stable
 */
export async function readThreadState(
  store: CheckpointStore,
  workflowName: string,
  threadId: string,
): Promise<ThreadInspection | null> {
  const namespace = namespaceFor({ name: workflowName });
  const tuple = await store.getTuple(threadId, namespace);
  if (!tuple) return null;
  return {
    workflowName,
    namespace,
    threadId,
    checkpointId: tuple.checkpoint.id,
    stepNumber: tuple.checkpoint.stepNumber,
    createdAt: tuple.checkpoint.createdAt,
    status: coerceStatus(tuple.metadata.status),
    state: unwrapPersistedState(tuple.checkpoint.state),
    ...(tuple.metadata.nodeName !== undefined ? { nodeName: tuple.metadata.nodeName } : {}),
    pendingPauses: readFrontier(tuple.metadata).pauses,
  };
}

/**
 * List every persisted checkpoint of `threadId` under workflow
 * `workflowName`, newest first as the store yields them, summarised
 * for operator display (id, parent, step, status, node).
 *
 * @stable
 */
export async function listThreadCheckpoints(
  store: CheckpointStore,
  workflowName: string,
  threadId: string,
): Promise<ReadonlyArray<ThreadCheckpointSummary>> {
  const namespace = namespaceFor({ name: workflowName });
  const out: ThreadCheckpointSummary[] = [];
  for await (const tuple of store.list(threadId, namespace)) {
    out.push({
      checkpointId: tuple.checkpoint.id,
      ...(tuple.checkpoint.parentId !== undefined ? { parentId: tuple.checkpoint.parentId } : {}),
      stepNumber: tuple.checkpoint.stepNumber,
      createdAt: tuple.checkpoint.createdAt,
      ...(tuple.metadata.status !== undefined ? { status: tuple.metadata.status } : {}),
      ...(tuple.metadata.nodeName !== undefined ? { nodeName: tuple.metadata.nodeName } : {}),
    });
  }
  return Object.freeze(out);
}
