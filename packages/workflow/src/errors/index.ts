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
  | 'cycle-detected'
  | 'thread-not-found'
  | 'checkpoint-not-found'
  | 'checkpoint-version-conflict'
  | 'resume-without-suspension'
  | 'concurrent-resume-rejected'
  | 'workflow-aborted'
  | 'workflow-cancel-timeout'
  | 'node-execution-failed'
  | 'reducer-failed'
  | 'state-validation-failed'
  | 'dead-end';

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

/** Thrown by {@link createWorkflow} on configuration validation failure. */
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

/** Thrown by {@link createWorkflow} when an edge references a node that is not registered. */
export class UnknownNodeError extends WorkflowError {
  readonly nodeName: string;

  constructor(nodeName: string, context: string) {
    super('unknown-node', `unknown node "${nodeName}" referenced from ${context}`);
    this.name = 'UnknownNodeError';
    this.nodeName = nodeName;
  }
}

/** Thrown when {@link Workflow.resume} cannot find the named thread. */
export class ThreadNotFoundError extends WorkflowError {
  readonly threadId: string;

  constructor(threadId: string) {
    super('thread-not-found', `no checkpoint found for thread "${threadId}"`);
    this.name = 'ThreadNotFoundError';
    this.threadId = threadId;
  }
}

/** Thrown when {@link Workflow.fork} cannot find the named checkpoint. */
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

/** Thrown by {@link Workflow.resume} when the named thread is not in a suspended state. */
export class ResumeWithoutSuspensionError extends WorkflowError {
  readonly threadId: string;
  readonly status: string;

  constructor(threadId: string, status: string) {
    super(
      'resume-without-suspension',
      `cannot resume thread "${threadId}" — current status is "${status}", expected "suspended"`,
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
 * Thrown when a checkpoint write detects that another writer advanced
 * the thread concurrently (WF-12) — the loser must not fork the
 * timeline.
 */
export class CheckpointVersionConflictError extends WorkflowError {
  readonly threadId: string;
  readonly expectedParentId: string;
  readonly actualLatestId: string;

  constructor(threadId: string, expectedParentId: string, actualLatestId: string) {
    super(
      'checkpoint-version-conflict',
      `thread "${threadId}" advanced concurrently — expected latest checkpoint "${expectedParentId}" but found "${actualLatestId}"`,
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
 * END edge (WF-14) — an all-false conditional fan is an error, not a
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

/** Thrown when a {@link Reducer} channel's `reduce(...)` callback throws. */
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
