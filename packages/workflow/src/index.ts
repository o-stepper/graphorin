/**
 * `@graphorin/workflow` - step-graph workflow engine for the Graphorin
 * framework.
 *
 * The package owns:
 *
 * - The `createWorkflow({...})` factory and the `Workflow.execute /
 *   resume / getState / listCheckpoints / fork` public surface.
 * - The synchronous-step execution loop (plan -> execute -> apply ->
 *   checkpoint -> repeat) with deterministic per-channel write merging.
 * - The HITL `pause(...)` / `resume(directive)` lifecycle backed by the
 *   pluggable `CheckpointStore` from `@graphorin/core` so paused runs
 *   survive process restarts.
 * - Dynamic parallelism via `Dispatch(node, args)` returned from a
 *   node's `run(...)` callback.
 * - Static `pauseAt.before` / `pauseAt.after` HITL declarations.
 * - The `AbortSignal`-aware hard-kill / cancellation contract with a
 *   configurable grace window.
 * - Seven stream emission modes (`values`, `updates`, `messages`,
 *   `tasks`, `checkpoints`, `debug`, `custom`) and the
 *   `workflow.run / workflow.step / workflow.task /
 *   workflow.checkpoint` observability spans.
 * - The in-memory `CheckpointStore` adapter for tests + small examples.
 *
 * The full documentation lives in the package `README.md`.
 *
 * @packageDocumentation
 */

/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };

export const VERSION: string = pkg.version;

export type {
  AnyValue,
  ApprovalPauseValue,
  AwakeablePauseValue,
  Barrier,
  Channel,
  ChannelKind,
  Checkpoint,
  CheckpointId,
  CheckpointMetadata,
  CheckpointStore,
  CheckpointTuple,
  DirectiveOptions,
  Ephemeral,
  LatestValue,
  ListAggregate,
  ListOptions,
  PendingWrite,
  Reducer,
  Stream,
  TimerPauseValue,
  WorkflowChannelUpdateEvent,
  WorkflowCheckpointWrittenEvent,
  WorkflowCustomEvent,
  WorkflowEndEvent,
  WorkflowErrorEvent,
  WorkflowEvent,
  WorkflowResumedEvent,
  WorkflowStartEvent,
  WorkflowStepEndEvent,
  WorkflowStepStartEvent,
  WorkflowSuspendedEvent,
  WorkflowTaskEndEvent,
  WorkflowTaskStartEvent,
} from '@graphorin/core';
export {
  anyValue,
  awaitExternal,
  barrier,
  Directive,
  Dispatch,
  dispatch,
  ephemeral,
  isApprovalPauseValue,
  isAwakeablePauseValue,
  isPauseSignal,
  isTimerPauseValue,
  latestValue,
  listAggregate,
  PAUSE_SIGNAL_BRAND,
  PauseSignal,
  pause,
  reducer,
  requestApproval,
  sleepFor,
  sleepUntil,
  stream,
} from '@graphorin/core';
export { InMemoryCheckpointStore } from './checkpoint-store-memory.js';
export {
  CheckpointNotFoundError,
  ConcurrentResumeError,
  InvalidChannelWriteError,
  InvalidWorkflowConfigError,
  MultiWriteError,
  NodeExecutionError,
  NodeTimeoutError,
  PauseNotFoundError,
  ReducerError,
  ResumeWithoutSuspensionError,
  ThreadNotFoundError,
  UnknownNodeError,
  WorkflowAbortedError,
  WorkflowDivergenceError,
  WorkflowError,
  type WorkflowErrorCode,
  WorkflowVersionMismatchError,
} from './errors/index.js';
export { createWorkflow } from './factory.js';
export { CHECKPOINT_SCHEMA_VERSION, namespaceFor } from './internal/engine.js';
export { createNode } from './node.js';
export {
  type CreateTimerDriverOptions,
  createTimerDriver,
  type TickableWorkflow,
  type TimerDriver,
  type TimerDriverEntry,
  type TimerDriverStatus,
  TimerDriverStoreUnsupportedError,
} from './timer-driver.js';
export type {
  DispatchLike,
  DurabilityMode,
  EdgePredicate,
  NodeRunResult,
  PendingPauseRecord,
  StreamMode,
  Workflow,
  WorkflowConfig,
  WorkflowContext,
  WorkflowEdge,
  WorkflowExecuteOptions,
  WorkflowNode,
  WorkflowNodeRetryPolicy,
  WorkflowNodeRun,
  WorkflowPauseAt,
  WorkflowResumeOptions,
  WorkflowState,
} from './types.js';
export { END_NODE, START_NODE, TASKS_CHANNEL } from './types.js';
