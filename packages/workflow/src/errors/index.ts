/**
 * Typed error surface for `@graphorin/workflow`. Every workflow-level
 * failure lands as a subclass of {@link WorkflowError} carrying the
 * stable string `code` discriminator so consumers can pattern-match
 * without inspecting messages.
 *
 * @packageDocumentation
 */

/**
 * Stable `code` discriminator on every {@link WorkflowError} subclass.
 * Treat as a string literal union for `switch (err.code)` style code.
 *
 * @stable
 */
export type WorkflowErrorCode =
  | 'invalid-config'
  | 'invalid-channel-write'
  | 'multi-write-into-latest-value'
  | 'unknown-node'
  | 'thread-not-found'
  | 'checkpoint-not-found'
  | 'checkpoint-version-conflict'
  | 'resume-without-suspension'
  | 'concurrent-resume-rejected'
  | 'workflow-aborted'
  | 'workflow-cancel-timeout'
  | 'max-steps-exceeded'
  | 'node-execution-failed'
  | 'reducer-failed'
  | 'state-validation-failed'
  | 'dead-end'
  | 'state-not-serializable'
  | 'node-timeout'
  | 'workflow-version-mismatch'
  | 'workflow-divergence'
  | 'pause-not-found'
  | 'pause-replay-divergence';

/**
 * Base error class for all `@graphorin/workflow` failures.
 *
 * @stable
 */
export class WorkflowError extends Error {
  readonly code: WorkflowErrorCode;
  override readonly cause?: unknown;
  readonly hint?: string;

  constructor(
    code: WorkflowErrorCode,
    message: string,
    opts: { readonly cause?: unknown; readonly hint?: string } = {},
  ) {
    super(message);
    this.name = 'WorkflowError';
    this.code = code;
    if (opts.cause !== undefined) this.cause = opts.cause;
    if (opts.hint !== undefined) this.hint = opts.hint;
  }
}

/** Thrown by `createWorkflow` on configuration validation failure. */
export class InvalidWorkflowConfigError extends WorkflowError {
  constructor(message: string, hint?: string) {
    super('invalid-config', message, hint === undefined ? {} : { hint });
    this.name = 'InvalidWorkflowConfigError';
  }
}

/** Thrown when a node writes a key not declared in `stateSchema`. */
export class InvalidChannelWriteError extends WorkflowError {
  readonly nodeName: string;
  readonly channel: string;

  constructor(nodeName: string, channel: string) {
    super(
      'invalid-channel-write',
      `node "${nodeName}" wrote into the channel "${channel}" but the channel is not declared on the workflow stateSchema`,
      { hint: 'declare the channel inside createWorkflow({ channels: { ... } })' },
    );
    this.name = 'InvalidChannelWriteError';
    this.nodeName = nodeName;
    this.channel = channel;
  }
}

/** Thrown when more than one writer in a single execution step writes a `LatestValue`. */
export class MultiWriteError extends WorkflowError {
  readonly channel: string;
  readonly writers: ReadonlyArray<string>;

  constructor(channel: string, writers: ReadonlyArray<string>) {
    super(
      'multi-write-into-latest-value',
      `multiple writers attempted to update the LatestValue channel "${channel}" within a single execution step (writers: ${writers.join(', ')})`,
      {
        hint: 'switch the channel kind to AnyValue, Reducer, ListAggregate, or Stream if collisions are intentional',
      },
    );
    this.name = 'MultiWriteError';
    this.channel = channel;
    this.writers = writers;
  }
}

/** Thrown by `createWorkflow` when an edge references a node that is not registered. */
export class UnknownNodeError extends WorkflowError {
  readonly nodeName: string;

  constructor(nodeName: string, context: string) {
    super('unknown-node', `unknown node "${nodeName}" referenced from ${context}`);
    this.name = 'UnknownNodeError';
    this.nodeName = nodeName;
  }
}

/** Thrown when `Workflow.resume` cannot find the named thread. */
export class ThreadNotFoundError extends WorkflowError {
  readonly threadId: string;

  constructor(threadId: string) {
    super('thread-not-found', `no checkpoint found for thread "${threadId}"`);
    this.name = 'ThreadNotFoundError';
    this.threadId = threadId;
  }
}

/** Thrown when `Workflow.fork` cannot find the named checkpoint. */
export class CheckpointNotFoundError extends WorkflowError {
  readonly threadId: string;
  readonly checkpointId: string;

  constructor(threadId: string, checkpointId: string) {
    super('checkpoint-not-found', `no checkpoint "${checkpointId}" found for thread "${threadId}"`);
    this.name = 'CheckpointNotFoundError';
    this.threadId = threadId;
    this.checkpointId = checkpointId;
  }
}

/** Thrown when a second concurrent resume is attempted for the same thread. */
export class ConcurrentResumeError extends WorkflowError {
  readonly threadId: string;

  constructor(threadId: string) {
    super(
      'concurrent-resume-rejected',
      `thread "${threadId}" is already being resumed; only one resume call is allowed per thread at a time`,
      { hint: 'await the in-flight resume() call before invoking another one' },
    );
    this.name = 'ConcurrentResumeError';
    this.threadId = threadId;
  }
}

/** Thrown by `Workflow.resume` when the named thread is not in a suspended state. */
export class ResumeWithoutSuspensionError extends WorkflowError {
  readonly threadId: string;
  readonly status: string;

  constructor(threadId: string, status: string) {
    super(
      'resume-without-suspension',
      `cannot resume thread "${threadId}" - current status is "${status}", expected "suspended"`,
    );
    this.name = 'ResumeWithoutSuspensionError';
    this.threadId = threadId;
    this.status = status;
  }
}

/** Thrown when a workflow run is cancelled via `AbortSignal`. */
export class WorkflowAbortedError extends WorkflowError {
  readonly threadId: string;

  constructor(threadId: string, reason?: string) {
    super(
      'workflow-aborted',
      reason !== undefined && reason.length > 0
        ? `workflow thread "${threadId}" aborted: ${reason}`
        : `workflow thread "${threadId}" aborted`,
    );
    this.name = 'WorkflowAbortedError';
    this.threadId = threadId;
  }
}

/** Thrown when a node throws and the failure is propagated through the engine. */
export class NodeExecutionError extends WorkflowError {
  readonly nodeName: string;

  constructor(nodeName: string, cause: unknown) {
    super('node-execution-failed', `node "${nodeName}" failed during execution`, { cause });
    this.name = 'NodeExecutionError';
    this.nodeName = nodeName;
  }
}

/**
 * Thrown when a node body exceeds its wall-clock budget (D1 /
 * workflow-03). The task's `ctx.signal` is aborted first so a
 * well-behaved body can stop; bodies that ignore the signal keep
 * running in the background (same contract as cancellation).
 */
export class NodeTimeoutError extends WorkflowError {
  readonly nodeName: string;
  readonly timeoutMs: number;

  constructor(nodeName: string, timeoutMs: number) {
    super('node-timeout', `node "${nodeName}" exceeded its ${timeoutMs}ms timeout`, {
      hint: 'raise timeoutMs on the node / nodeDefaults, or honour ctx.signal in the body',
    });
    this.name = 'NodeTimeoutError';
    this.nodeName = nodeName;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Thrown on resume when the stored frontier was written by a different
 * `WorkflowConfig.version` (D1 / workflow-14) - replaying
 * persisted state through changed code must fail loudly, not silently
 * diverge. Opt out per call via `allowVersionMismatch`.
 */
export class WorkflowVersionMismatchError extends WorkflowError {
  readonly threadId: string;
  readonly storedVersion: string;
  readonly currentVersion: string;

  constructor(threadId: string, storedVersion: string, currentVersion: string) {
    super(
      'workflow-version-mismatch',
      `thread "${threadId}" was suspended by workflow version "${storedVersion}" but the current definition is "${currentVersion}"`,
      {
        hint: 'migrate the thread, or resume with { allowVersionMismatch: true } after verifying compatibility',
      },
    );
    this.name = 'WorkflowVersionMismatchError';
    this.threadId = threadId;
    this.storedVersion = storedVersion;
    this.currentVersion = currentVersion;
  }
}

/**
 * Thrown on resume when the persisted frontier references nodes that no
 * longer exist in the workflow definition (D1) - the definition changed
 * mid-flight and a silent re-plan would diverge from the journal.
 */
export class WorkflowDivergenceError extends WorkflowError {
  readonly threadId: string;
  readonly missingNodes: ReadonlyArray<string>;

  constructor(threadId: string, missingNodes: ReadonlyArray<string>) {
    super(
      'workflow-divergence',
      `thread "${threadId}" cannot resume: the persisted frontier references node(s) ${missingNodes.map((n) => `"${n}"`).join(', ')} that are absent from the current definition`,
      {
        hint: 'restore the original definition, or fork the thread and migrate its state explicitly',
      },
    );
    this.name = 'WorkflowDivergenceError';
    this.threadId = threadId;
    this.missingNodes = missingNodes;
  }
}

/**
 * Thrown by `resolveAwakeable` / `approve` (D1) when no pending pause
 * carries the requested name.
 */
export class PauseNotFoundError extends WorkflowError {
  readonly threadId: string;
  readonly pauseName: string;

  constructor(threadId: string, pauseName: string) {
    super(
      'pause-not-found',
      `thread "${threadId}" has no pending awakeable/approval named "${pauseName}"`,
      { hint: 'inspect getState(threadId).pendingPauses for the names currently awaited' },
    );
    this.name = 'PauseNotFoundError';
    this.threadId = threadId;
    this.pauseName = pauseName;
  }
}

/**
 * Thrown when a checkpoint write detects that another writer advanced
 * the thread concurrently (WF-12) - the loser must not fork the
 * timeline.
 */
export class CheckpointVersionConflictError extends WorkflowError {
  readonly threadId: string;
  readonly expectedParentId: string;
  readonly actualLatestId: string;

  constructor(threadId: string, expectedParentId: string, actualLatestId: string) {
    super(
      'checkpoint-version-conflict',
      `thread "${threadId}" advanced concurrently - expected latest checkpoint "${expectedParentId}" but found "${actualLatestId}"`,
      { hint: 'another resume/run of this thread won the race; re-read state before retrying' },
    );
    this.name = 'CheckpointVersionConflictError';
    this.threadId = threadId;
    this.expectedParentId = expectedParentId;
    this.actualLatestId = actualLatestId;
  }
}

/**
 * Thrown when planning stalls with no runnable tasks and no satisfied
 * END edge (WF-14) - an all-false conditional fan is an error, not a
 * silent completion.
 */
export class DeadEndError extends WorkflowError {
  readonly workflowName: string;
  readonly stalledNodes: ReadonlyArray<string>;

  constructor(workflowName: string, stalledNodes: ReadonlyArray<string>) {
    super(
      'dead-end',
      `workflow "${workflowName}" dead-ended: node(s) ${stalledNodes.map((n) => `"${n}"`).join(', ')} completed but no outgoing edge fired and no __end__ edge is satisfied`,
      { hint: 'add an unconditional fallback edge or an edge to __end__ covering this state' },
    );
    this.name = 'DeadEndError';
    this.workflowName = workflowName;
    this.stalledNodes = stalledNodes;
  }
}

/**
 * Thrown when a value that rides the checkpoint would not survive a
 * JSON round-trip (WF-10) - Map/Set/Date/class instances silently
 * degrade with the SQLite store, so every store rejects them eagerly.
 * Covers EVERYTHING that round-trips through the checkpoint (W-121):
 * channel state, pause values and approval payloads, dispatchArgs,
 * satisfied resume values, and operator directives (validated at
 * resume entry, before the node body runs). The pseudo-channels
 * `<pause:node>` / `<dispatch:node>` / `<task:node>` / `<directive>`
 * name the offending surface.
 */
export class StateNotSerializableError extends WorkflowError {
  readonly channel: string;
  readonly path: string;

  constructor(channel: string, path: string, kind: string) {
    super(
      'state-not-serializable',
      `channel "${channel}" holds a non-JSON-safe value (${kind} at ${path}) - checkpoint state must survive a JSON round-trip`,
      {
        hint: 'store plain objects/arrays/primitives in workflow state; convert Map/Set/Date to JSON-safe shapes before writing the channel',
      },
    );
    this.name = 'StateNotSerializableError';
    this.channel = channel;
    this.path = path;
  }
}

/** Thrown when a `Reducer` channel's `reduce(...)` callback throws. */
export class ReducerError extends WorkflowError {
  readonly channel: string;

  constructor(channel: string, cause: unknown) {
    super('reducer-failed', `reducer for channel "${channel}" threw while merging writes`, {
      cause,
    });
    this.name = 'ReducerError';
    this.channel = channel;
  }
}
