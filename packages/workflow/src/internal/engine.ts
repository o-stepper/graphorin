/**
 * Step-graph workflow engine. Owns the inner execution loop:
 *
 * 1. plan tasks (consult triggered edges + static `pauseAt.before`),
 * 2. execute the planned tasks in parallel,
 * 3. apply each task's writes atomically per channel,
 * 4. write a checkpoint per the configured durability mode,
 * 5. honour the suspended-or-cancelled exit conditions, and
 * 6. repeat until the run terminates (or `maxSteps` is reached).
 *
 * Durability contract (WF-1/2/3/12): every persisted checkpoint carries a
 * *frontier envelope* in `metadata.tags` - the full set of pending pauses,
 * dynamic tasks, and completed-but-unwalked nodes - so a resume (or a
 * crash-recovery resume from a `'running'` checkpoint, or a `retry` from a
 * `'failed'` one) restores exactly the work that was in flight. Checkpoint
 * puts are guarded by a compare-and-set on the latest stored checkpoint so
 * two racing resumes cannot both advance one thread.
 *
 * The engine is intentionally agnostic of the surrounding async
 * iterable: the public `Workflow.execute / resume` factory turns the
 * engine's emitted events into an `AsyncIterable<WorkflowEvent>`.
 *
 * @packageDocumentation
 */

import type {
  Channel,
  Checkpoint,
  CheckpointMetadata,
  Directive,
  Tracer,
  WorkflowEvent,
} from '@graphorin/core';
import {
  CheckpointConflictError,
  Dispatch,
  isApprovalPauseValue,
  isAwakeablePauseValue,
  isPauseSignal,
  isReplayDivergenceSignal,
  isTimerPauseValue,
  runWithPauseResume,
} from '@graphorin/core';

import {
  CheckpointNotFoundError,
  CheckpointVersionConflictError,
  ConcurrentResumeError,
  DeadEndError,
  NodeExecutionError,
  NodeTimeoutError,
  PauseNotFoundError,
  ResumeWithoutSuspensionError,
  StateNotSerializableError,
  ThreadNotFoundError,
  WorkflowAbortedError,
  WorkflowDivergenceError,
  WorkflowError,
  WorkflowVersionMismatchError,
} from '../errors/index.js';
import {
  type DispatchLike,
  type DurabilityMode,
  END_NODE,
  type PendingPauseRecord,
  START_NODE,
  type StreamMode,
  type WorkflowConfig,
  type WorkflowContext,
  type WorkflowNode,
  type WorkflowNodeRetryPolicy,
} from '../types.js';
import { applyWrites, buildInitialState, type ChannelWrite } from './channels.js';
import { newId } from './ids.js';

/**
 * @internal - invocation parameters for a single run.
 */
export interface EngineRunOptions<TState extends object, TInput> {
  readonly config: WorkflowConfig<TState>;
  readonly threadId: string;
  readonly input: TInput;
  readonly streamMode: StreamMode;
  readonly signal?: AbortSignal;
  readonly durability?: DurabilityMode;
}

/**
 * @internal - invocation parameters for a resume.
 */
export interface EngineResumeOptions<TState extends object> {
  readonly config: WorkflowConfig<TState>;
  readonly threadId: string;
  readonly directive?: Directive;
  readonly streamMode: StreamMode;
  readonly signal?: AbortSignal;
  readonly durability?: DurabilityMode;
  /**
   * Per-workflow-instance re-entrancy guard supplied by the factory.
   * Cross-instance / cross-process races are caught by the store-level
   * compare-and-set instead (`checkpoint-version-conflict`).
   */
  readonly resumeLock?: Set<string>;
  /**
   * `'resume'` continues a `'suspended'` / `'running'` (crash) /
   * `'aborted'` thread; `'retry'` restarts a `'failed'` or `'aborted'`
   * one by replaying the persisted writes of its successful tasks.
   */
  readonly mode?: 'resume' | 'retry';
  /**
   * D1: pick WHICH pending pause receives the resume value. Used by
   * `resolveAwakeable` / `approve` (match by `name`) and `tick` (match
   * by due `wakeAt`). Absent ⇒ the first pause (legacy behaviour). A
   * selector that matches nothing fails with `pause-not-found`.
   */
  readonly selectPause?: (pause: PendingPauseRecord) => boolean;
  /** Human-readable target for the pause-not-found error message. */
  readonly selectPauseLabel?: string;
  /** Skip the workflow-version pin check (D1). */
  readonly allowVersionMismatch?: boolean;
}

/**
 * @internal - workflow namespace used in checkpoint store keys. The
 * engine binds the namespace to the workflow `name` so a single store
 * can host checkpoints from multiple workflows without collision.
 */
export function namespaceFor(config: { readonly name: string }): string {
  return `workflow/${config.name}`;
}

/**
 * W-120: identity of a pause record for the replay-divergence check -
 * durable-primitive `kind` off the pause value plus the awakeable /
 * approval `name`. A plain `pause()` yields `{}` (never checked).
 */
function pauseMetaOf(record: {
  readonly value: unknown;
  readonly name?: string;
}): { readonly kind?: string; readonly name?: string } {
  const v = record.value as { readonly kind?: unknown } | null | undefined;
  const kind = typeof v === 'object' && v !== null && typeof v.kind === 'string' ? v.kind : undefined;
  return {
    ...(kind !== undefined ? { kind } : {}),
    ...(record.name !== undefined ? { name: record.name } : {}),
  };
}

function describePauseIdentity(id: { readonly kind?: string; readonly name?: string }): string {
  const parts: string[] = [];
  if (id.kind !== undefined) parts.push(`kind '${id.kind}'`);
  if (id.name !== undefined) parts.push(`name '${id.name}'`);
  return parts.length > 0 ? parts.join(' / ') : 'a plain pause';
}

/** W-120: prior satisfiedMeta, padded with nulls for legacy records. */
function priorMetaOf(record: {
  readonly satisfied?: ReadonlyArray<unknown>;
  readonly satisfiedMeta?: ReadonlyArray<{ readonly kind?: string; readonly name?: string } | null>;
}): Array<{ readonly kind?: string; readonly name?: string } | null> {
  if (record.satisfiedMeta !== undefined) return [...record.satisfiedMeta];
  return (record.satisfied ?? []).map(() => null);
}

let warnedLegacyAsyncDurability = false;

/**
 * WF-7: `'async'` was removed from {@link DurabilityMode} - it was
 * byte-identical to `'sync'`. Legacy JS callers that still pass it get
 * `'sync'` behaviour and a one-time warning instead of a crash.
 */
function normalizeDurability(mode: DurabilityMode | undefined): DurabilityMode {
  if ((mode as string) === 'async') {
    if (!warnedLegacyAsyncDurability) {
      warnedLegacyAsyncDurability = true;
      process.stderr.write(
        "[graphorin/workflow] durability 'async' was removed (it was identical to 'sync'); running with 'sync'. Update the config.\n",
      );
    }
    return 'sync';
  }
  return mode ?? 'sync';
}

const DEFAULT_MAX_STEPS = 200;
const DEFAULT_CANCEL_GRACE_MS = 100;

interface PlannedTask {
  readonly taskId: string;
  readonly nodeName: string;
  readonly source: 'edge' | 'dispatch' | 'resume' | 'start';
  readonly dispatchArgs?: unknown;
  /**
   * Ordered values replayed to the node's `pause()` calls on re-run
   * (WF-2). Empty array = run with an active-but-empty replay scope, so
   * every programmatic `pause()` suspends (the static-before case).
   */
  readonly resumeValues?: ReadonlyArray<unknown>;
  /** W-120: identity of the pause each resume value answers. */
  readonly resumeMeta?: ReadonlyArray<{ readonly kind?: string; readonly name?: string } | null>;
  readonly staticBefore?: boolean;
  readonly staticAfter?: boolean;
}

interface RunInternalState<TState extends object> {
  state: TState;
  versions: Record<string, number>;
  /** Fresh tasks scheduled for the next step via {@link Dispatch}. */
  pendingDynamicTasks: PlannedTask[];
  /** Names of nodes that completed during the previous step. */
  lastCompletedNodes: string[];
  stepNumber: number;
  parentCheckpointId: string | undefined;
  /** Every pause raised by the current suspension (parallel pausers included). */
  pendingPauses: PendingPauseRecord[];
  status: 'running' | 'suspended' | 'completed' | 'failed' | 'aborted';
  closed: boolean;
}

/**
 * @internal - execute the engine's inner loop and yield workflow
 * events as they occur. The factory layer turns this into a plain
 * `AsyncIterable`.
 */
export async function* runEngine<TState extends object, TInput extends Partial<TState>>(
  opts: EngineRunOptions<TState, TInput>,
): AsyncIterable<WorkflowEvent<TState>> {
  const { config, threadId, input, streamMode, signal } = opts;
  const tracer = config.tracer;
  const channels = config.channels as Readonly<Record<string, Channel<unknown>>>;
  const namespace = namespaceFor(config);
  const durability = normalizeDurability(opts.durability ?? config.durability);

  const initialState = buildInitialState<TState>({
    channels,
    ...(config.initialState !== undefined ? { initial: config.initialState } : {}),
    inputState: input,
  });

  const internal: RunInternalState<TState> = {
    state: initialState,
    versions: {},
    pendingDynamicTasks: [],
    lastCompletedNodes: [START_NODE],
    stepNumber: 0,
    parentCheckpointId: undefined,
    pendingPauses: [],
    status: 'running',
    closed: false,
  };

  const span = tracer?.startSpan({
    type: 'workflow.run',
    attrs: {
      'graphorin.workflow.name': config.name,
      'graphorin.workflow.thread_id': threadId,
    },
  });

  yield {
    type: 'workflow.start',
    threadId,
    workflowId: config.name,
  } satisfies WorkflowEvent<TState>;

  try {
    yield* driveRun<TState>({
      config,
      tracer,
      channels,
      namespace,
      threadId,
      durability,
      streamMode,
      signal: signal,
      internal,
    });
  } catch (err) {
    yield emitError<TState>(threadId, err);
  } finally {
    span?.setStatus(internal.status === 'failed' || internal.status === 'aborted' ? 'error' : 'ok');
    span?.end();
  }
}

/**
 * @internal - resume a previously suspended (or crashed / aborted /
 * failed) thread.
 */
export async function* resumeEngine<TState extends object>(
  opts: EngineResumeOptions<TState>,
): AsyncIterable<WorkflowEvent<TState>> {
  const { config, threadId, directive, streamMode, signal } = opts;
  const tracer = config.tracer;
  const channels = config.channels as Readonly<Record<string, Channel<unknown>>>;
  const namespace = namespaceFor(config);
  const durability = normalizeDurability(opts.durability ?? config.durability);
  const mode = opts.mode ?? 'resume';
  const lock = opts.resumeLock;

  if (lock?.has(threadId)) {
    throw new ConcurrentResumeError(threadId);
  }
  lock?.add(threadId);

  try {
    // W-121: directive payloads round-trip through the frontier exactly
    // like state does - a Date resume value would come back as an ISO
    // string on the NEXT resume. Fail the operator NOW, before the node
    // body runs, with the same WF-10 walker and error.
    if (directive?.resume !== undefined) {
      const offender = findNonJsonSafe(directive.resume, '<directive>.resume');
      if (offender !== null) {
        yield emitError<TState>(
          threadId,
          new StateNotSerializableError('<directive>', offender.path, offender.kind),
        );
        return;
      }
    }
    if (directive?.update !== undefined) {
      const offender = findNonJsonSafe(directive.update, '<directive>.update');
      if (offender !== null) {
        yield emitError<TState>(
          threadId,
          new StateNotSerializableError('<directive>', offender.path, offender.kind),
        );
        return;
      }
    }
    const tuple = await config.checkpointStore.getTuple(threadId, namespace);
    if (!tuple) {
      yield emitError<TState>(threadId, new ThreadNotFoundError(threadId));
      return;
    }
    const status = tuple.metadata.status;
    const resumable =
      mode === 'retry'
        ? status === 'failed' || status === 'aborted'
        : // WF-3: a latest-checkpoint status of 'running' means the process
          // died mid-run - the checkpoint is a valid recovery point, not an
          // active lease. The store-level CAS protects the genuinely-live case.
          status === 'suspended' || status === 'running' || status === 'aborted';
    if (!resumable) {
      yield emitError<TState>(threadId, new ResumeWithoutSuspensionError(threadId, status));
      return;
    }
    const restored = restoreState<TState>(tuple.checkpoint, channels);
    const frontier = readFrontier(tuple.metadata);

    // D1 / workflow-14: fail loudly when the stored frontier was written
    // by a different pinned workflow version - replaying state through
    // changed code silently diverges from the journal.
    if (
      opts.allowVersionMismatch !== true &&
      frontier.version !== undefined &&
      config.version !== undefined &&
      frontier.version !== config.version
    ) {
      yield emitError<TState>(
        threadId,
        new WorkflowVersionMismatchError(threadId, frontier.version, config.version),
      );
      return;
    }
    // D1: journal-divergence detection - the frontier must only reference
    // nodes the current definition still declares.
    const missingNodes = [
      ...new Set(
        [
          ...frontier.pauses.map((p) => p.nodeName),
          ...frontier.dynamic.map((d) => d.nodeName),
          ...frontier.completed,
          ...(frontier.stepTasks ?? []).map((t) => t.nodeName),
        ].filter((n) => n !== START_NODE && !(n in config.nodes)),
      ),
    ];
    if (missingNodes.length > 0) {
      yield emitError<TState>(threadId, new WorkflowDivergenceError(threadId, missingNodes));
      return;
    }

    const internal: RunInternalState<TState> = {
      state: restored.state,
      versions: { ...restored.versions },
      pendingDynamicTasks: [],
      lastCompletedNodes: [],
      // WF-4: advance the step counter on resume so the first post-resume
      // checkpoint is strictly newer than the suspended one. Without this they
      // tie, and `getTuple` (max stepNumber) returns the STALE suspended
      // checkpoint - re-running the pause node after a crash, and livelocking a
      // node that pauses twice in a row.
      stepNumber: tuple.checkpoint.stepNumber + 1,
      parentCheckpointId: tuple.checkpoint.id,
      pendingPauses: [],
      status: 'running',
      closed: false,
    };

    if (status === 'failed' || status === 'aborted') {
      // WF-3/WF-6 replay path: completed tasks of the failed step replay
      // from their persisted pending writes; everything else re-runs.
      const stepTasks = frontier.stepTasks ?? [];
      const completed = stepTasks.filter((t) => t.status === 'completed');
      const completedIds = new Set(completed.map((t) => t.taskId));
      const nameByTask = new Map(stepTasks.map((t) => [t.taskId, t.nodeName] as const));
      const replayWrites: ChannelWrite[] = (tuple.pendingWrites ?? [])
        .filter((w) => completedIds.has(w.taskId))
        .map((w) => ({
          nodeName: nameByTask.get(w.taskId) ?? '<replay>',
          taskId: w.taskId,
          index: w.index,
          channel: w.channel,
          value: w.value,
        }));
      if (replayWrites.length > 0) {
        const applied = applyWrites<TState>({
          state: internal.state,
          versions: internal.versions,
          channels,
          writes: replayWrites,
        });
        internal.state = applied.state;
        internal.versions = { ...applied.versions };
      }
      internal.lastCompletedNodes = completed.map((t) => t.nodeName);
      // workflow-08: a task that PAUSED in the failed step re-runs with
      // its already-delivered pause answers replayed - the failure
      // frontier now persists the pause records, so satisfied values are
      // no longer dropped on sibling failure.
      const pauseByNode = new Map(frontier.pauses.map((p) => [p.nodeName, p] as const));
      internal.pendingDynamicTasks = stepTasks
        .filter((t) => t.status !== 'completed')
        .map((t) => {
          const pauseRecord = t.status === 'paused' ? pauseByNode.get(t.nodeName) : undefined;
          if (pauseRecord !== undefined) {
            return {
              taskId: newId('task'),
              nodeName: t.nodeName,
              source: 'resume' as const,
              ...(t.dispatchArgs !== undefined ? { dispatchArgs: t.dispatchArgs } : {}),
              resumeValues: pauseRecord.staticBefore ? [] : [...(pauseRecord.satisfied ?? [])],
              resumeMeta: pauseRecord.staticBefore ? [] : priorMetaOf(pauseRecord),
              ...(pauseRecord.staticBefore ? { staticBefore: true } : {}),
            };
          }
          return {
            taskId: newId('task'),
            nodeName: t.nodeName,
            source: 'dispatch' as const,
            ...(t.dispatchArgs !== undefined ? { dispatchArgs: t.dispatchArgs } : {}),
          };
        });
    } else {
      // Suspended or crash ('running') resume: restore the persisted
      // frontier - completed-but-unwalked nodes and surviving dynamic
      // tasks (WF-1) - then fan the pause records back out.
      internal.lastCompletedNodes = [...frontier.completed];
      internal.pendingDynamicTasks = frontier.dynamic.map((d) => ({
        taskId: newId('task'),
        nodeName: d.nodeName,
        source: 'dispatch' as const,
        ...(d.dispatchArgs !== undefined ? { dispatchArgs: d.dispatchArgs } : {}),
      }));

      // D1 / workflow-04 (opt-in journalSteps): crash recovery from a
      // 'running' checkpoint consumes the step journal when present -
      // completed tasks of the interrupted step replay from their
      // journaled writes; only unfinished work re-runs. The journal
      // supersedes the frontier fan-out (the intent's task list already
      // captured it at planning time).
      let journalRecovered = false;
      if (status === 'running' && config.journalSteps === true) {
        const journal = readStepJournal(tuple, internal.stepNumber);
        if (journal !== null) {
          if (journal.replayWrites.length > 0) {
            const applied = applyWrites<TState>({
              state: internal.state,
              versions: internal.versions,
              channels,
              writes: journal.replayWrites,
            });
            internal.state = applied.state;
            internal.versions = { ...applied.versions };
          }
          internal.lastCompletedNodes = journal.completedNodes;
          internal.pendingDynamicTasks = journal.rerunTasks;
          journalRecovered = true;
        }
      }

      if (journalRecovered) {
        // Frontier fan-out skipped: the journal's intent captured the
        // interrupted step's full task list at planning time.
      } else if (directive?.goto) {
        // workflow-09: goto is DESTRUCTIVE by contract - the restored
        // frontier (dynamic tasks, unwalked nodes, pending pause records
        // with their delivered answers) is discarded in favour of the
        // single goto task. Documented on Directive.goto.
        internal.pendingDynamicTasks = [
          {
            taskId: newId('task'),
            nodeName: directive.goto,
            source: 'dispatch',
          },
        ];
        internal.lastCompletedNodes = [];
      } else {
        // D1: awakeables / timers pick their target pause explicitly;
        // the default stays "first pause" for plain resumes.
        let orderedPauses = frontier.pauses;
        if (opts.selectPause !== undefined) {
          const target = frontier.pauses.find((pauseRecord) => opts.selectPause?.(pauseRecord));
          if (target === undefined) {
            yield emitError<TState>(
              threadId,
              new PauseNotFoundError(threadId, opts.selectPauseLabel ?? '<selector>'),
            );
            return;
          }
          orderedPauses = [
            target,
            ...frontier.pauses.filter((pauseRecord) => pauseRecord !== target),
          ];
        }
        const [primary, ...others] = orderedPauses;
        if (primary) {
          if (primary.staticAfter) {
            // The paused node already completed; resume by walking its
            // outgoing edges instead of re-running the body.
            if (!internal.lastCompletedNodes.includes(primary.nodeName)) {
              internal.lastCompletedNodes.push(primary.nodeName);
            }
          } else {
            internal.pendingDynamicTasks.push({
              taskId: newId('task'),
              nodeName: primary.nodeName,
              source: 'resume',
              ...(primary.dispatchArgs !== undefined ? { dispatchArgs: primary.dispatchArgs } : {}),
              // WF-2: replay every previously-delivered value, then the new
              // directive value. A static-before gate replays NOTHING - the
              // operator approved the node to run, not any inner pause().
              resumeValues: primary.staticBefore
                ? []
                : [...(primary.satisfied ?? []), directive?.resume],
              // W-120: the new directive value answers THIS pause - pin
              // its identity so a divergent replay is caught.
              resumeMeta: primary.staticBefore
                ? []
                : [...priorMetaOf(primary), pauseMetaOf(primary)],
              ...(primary.staticBefore ? { staticBefore: true } : {}),
            });
          }
        }
        for (const record of others) {
          // Parallel pausers beyond the first re-run with only their
          // already-satisfied values - they re-suspend rather than get lost.
          if (record.staticAfter) {
            if (!internal.lastCompletedNodes.includes(record.nodeName)) {
              internal.lastCompletedNodes.push(record.nodeName);
            }
            continue;
          }
          internal.pendingDynamicTasks.push({
            taskId: newId('task'),
            nodeName: record.nodeName,
            source: 'resume',
            ...(record.dispatchArgs !== undefined ? { dispatchArgs: record.dispatchArgs } : {}),
            resumeValues: record.staticBefore ? [] : [...(record.satisfied ?? [])],
            resumeMeta: record.staticBefore ? [] : priorMetaOf(record),
            ...(record.staticBefore ? { staticBefore: true } : {}),
          });
        }
      }
    }

    if (directive?.update) {
      const writes = directiveUpdateToWrites('__resume__', directive.update);
      const applied = applyWrites<TState>({
        state: internal.state,
        versions: internal.versions,
        channels,
        writes,
      });
      internal.state = applied.state;
      internal.versions = { ...applied.versions };
    }

    const span = tracer?.startSpan({
      type: 'workflow.run',
      attrs: {
        'graphorin.workflow.name': config.name,
        'graphorin.workflow.thread_id': threadId,
        'graphorin.workflow.resumed': true,
      },
    });

    yield {
      type: 'workflow.resumed',
      threadId,
      stepNumber: internal.stepNumber,
      state: internal.state,
    } satisfies WorkflowEvent<TState>;

    try {
      yield* driveRun<TState>({
        config,
        tracer,
        channels,
        namespace,
        threadId,
        durability,
        streamMode,
        signal: signal,
        internal,
      });
    } catch (err) {
      yield emitError<TState>(threadId, err);
    } finally {
      span?.setStatus(
        internal.status === 'failed' || internal.status === 'aborted' ? 'error' : 'ok',
      );
      span?.end();
    }
  } finally {
    lock?.delete(threadId);
  }
}

interface DriveRunArgs<TState extends object> {
  readonly config: WorkflowConfig<TState>;
  readonly tracer: Tracer | undefined;
  readonly channels: Readonly<Record<string, Channel<unknown>>>;
  readonly namespace: string;
  readonly threadId: string;
  readonly durability: DurabilityMode;
  readonly streamMode: StreamMode;
  readonly signal: AbortSignal | undefined;
  readonly internal: RunInternalState<TState>;
}

async function* driveRun<TState extends object>(
  args: DriveRunArgs<TState>,
): AsyncIterable<WorkflowEvent<TState>> {
  const {
    config,
    tracer,
    channels,
    namespace,
    threadId,
    durability,
    streamMode,
    signal,
    internal,
  } = args;
  const maxSteps = config.maxSteps ?? DEFAULT_MAX_STEPS;
  const cancelGraceMs = config.cancelGraceMs ?? DEFAULT_CANCEL_GRACE_MS;
  // Stream-mode emit gates per `04-workflow-engine.md` § Stream modes.
  // Lifecycle events (`workflow.start / end / suspended / resumed /
  // error`) are emitted in every mode; the per-mode flags below
  // toggle the optional intra-step emits.
  const includeStepEvents = streamMode === 'values' || streamMode === 'debug';
  const includeTaskEvents = streamMode === 'tasks' || streamMode === 'debug';
  const includeChannelEvents =
    streamMode === 'updates' || streamMode === 'messages' || streamMode === 'debug';
  const includeCheckpointEvents = streamMode === 'checkpoints' || streamMode === 'debug';
  const includeCustomEvents = streamMode === 'custom' || streamMode === 'debug';

  while (!internal.closed) {
    if (signal?.aborted) {
      // workflow-12: persist a terminal 'aborted' checkpoint before
      // throwing so the thread never reports 'running' forever.
      internal.status = 'aborted';
      await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: 'aborted',
        frontier: frontierFromInternal(internal, config),
      });
      throw new WorkflowAbortedError(threadId, signalAbortReason(signal));
    }
    if (internal.stepNumber >= maxSteps) {
      // workflow-12: same terminal-status contract for the step cap.
      internal.status = 'failed';
      await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: 'failed',
        frontier: frontierFromInternal(internal, config),
      });
      throw new WorkflowError(
        'max-steps-exceeded',
        `workflow "${config.name}" exceeded the maxSteps cap (${maxSteps}); aborting to prevent runaway execution`,
        { hint: 'increase maxSteps on createWorkflow({...}) or check for an infinite edge cycle' },
      );
    }

    const { tasks, suspendBefore, deadEnd } = planTasks(config, internal);

    if (deadEnd) {
      // WF-14: no fired edges, no END edge, no dynamic tasks - the graph is
      // wedged. Persist 'failed' and surface a typed error instead of a
      // silent `workflow.end`.
      internal.status = 'failed';
      const checkpointId = await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: 'failed',
        nodeName: deadEnd[0] ?? '<dead-end>',
        frontier: emptyFrontier(),
      });
      if (includeCheckpointEvents && checkpointId !== null) {
        yield checkpointEvent<TState>(checkpointId, internal.stepNumber);
      }
      throw new DeadEndError(config.name, deadEnd);
    }

    if (suspendBefore) {
      const pause: PendingPauseRecord = {
        nodeName: suspendBefore.nodeName,
        value: { kind: 'static-before', node: suspendBefore.nodeName },
        ...(suspendBefore.dispatchArgs !== undefined
          ? { dispatchArgs: suspendBefore.dispatchArgs }
          : {}),
        staticBefore: true,
      };
      // The non-gated siblings planned for this step survive the
      // suspension as dynamic frontier entries (WF-1).
      internal.pendingDynamicTasks = suspendBefore.rest;
      internal.pendingPauses = [pause];
      internal.status = 'suspended';
      const checkpointId = await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: 'suspended',
        nodeName: suspendBefore.nodeName,
        frontier: frontierFromInternal(internal, config),
      });
      if (includeCheckpointEvents && checkpointId !== null) {
        yield checkpointEvent<TState>(checkpointId, internal.stepNumber);
      }
      yield {
        type: 'workflow.suspended',
        threadId,
        stepNumber: internal.stepNumber,
        state: internal.state,
        value: pause.value,
      } satisfies WorkflowEvent<TState>;
      internal.closed = true;
      return;
    }

    if (tasks.length === 0) {
      internal.status = 'completed';
      const checkpointId = await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: 'completed',
      });
      if (includeCheckpointEvents && checkpointId !== null) {
        yield checkpointEvent<TState>(checkpointId, internal.stepNumber);
      }
      yield {
        type: 'workflow.end',
        threadId,
        state: internal.state,
      } satisfies WorkflowEvent<TState>;
      internal.closed = true;
      return;
    }

    if (includeStepEvents) {
      yield {
        type: 'workflow.step.start',
        stepNumber: internal.stepNumber,
        state: internal.state,
      } satisfies WorkflowEvent<TState>;
    }

    const stepSpan = tracer?.startSpan({
      type: 'workflow.step',
      attrs: {
        'graphorin.workflow.name': config.name,
        'graphorin.workflow.step_number': internal.stepNumber,
        'graphorin.workflow.tasks_planned': tasks.length,
      },
    });

    // WF-15: task/custom events are pumped LIVE while the parallel
    // tasks run - pushes wake the pump below instead of waiting for
    // the whole step to settle.
    const stepEvents: WorkflowEvent<TState>[] = [];
    const customEvents: WorkflowEvent<TState>[] = [];
    let notifyEventPump: (() => void) | undefined;
    const wakeEventPump = (): void => {
      const notify = notifyEventPump;
      notifyEventPump = undefined;
      notify?.();
    };

    const taskController = new AbortController();
    const onSignalAbort = (): void => taskController.abort();
    if (signal?.aborted) onSignalAbort();
    else signal?.addEventListener('abort', onSignalAbort, { once: true });

    let nodeFailure: { nodeName: string; cause: unknown } | undefined;
    const taskOutcomes: Array<{
      task: PlannedTask;
      writes: ChannelWrite[];
      paused?: { value: unknown };
      durationMs: number;
      status: 'completed' | 'paused' | 'failed';
      pendingDispatches: PlannedTask[];
    }> = [];

    // WF-9: every task observes the same frozen checkpoint-equivalent
    // snapshot - in-place mutation throws instead of corrupting siblings
    // or the persisted state.
    const stateView = deepFreeze(structuredClone(internal.state)) as TState;

    // D1 / workflow-04 (opt-in): journal a step-intent record against the
    // parent checkpoint BEFORE execution so crash recovery knows exactly
    // which tasks were in flight; each completed task then journals its
    // writes as it finishes. First step has no parent to attach to -
    // a crash there re-runs the whole step (documented).
    const journalCheckpointId =
      config.journalSteps === true && internal.parentCheckpointId !== undefined
        ? internal.parentCheckpointId
        : null;
    if (journalCheckpointId !== null) {
      await config.checkpointStore.putWrites(
        threadId,
        namespace,
        journalCheckpointId,
        [
          {
            taskId: STEP_INTENT_TASK_ID,
            index: 0,
            channel: STEP_INTENT_CHANNEL,
            value: {
              v: 1,
              stepNumber: internal.stepNumber,
              tasks: tasks.map((t) => ({
                taskId: t.taskId,
                nodeName: t.nodeName,
                source: t.source,
                ...(t.dispatchArgs !== undefined ? { dispatchArgs: t.dispatchArgs } : {}),
                ...(t.resumeValues !== undefined ? { resumeValues: [...t.resumeValues] } : {}),
      ...(t.resumeMeta !== undefined ? { resumeMeta: [...t.resumeMeta] } : {}),
                ...(t.resumeMeta !== undefined ? { resumeMeta: [...t.resumeMeta] } : {}),
                ...(t.staticBefore === true ? { staticBefore: true } : {}),
              })),
            },
          },
        ],
        STEP_INTENT_TASK_ID,
      );
    }

    // D1 / workflow-10: bounded per-step concurrency. Tasks past the cap
    // queue and start as slots free up; absent ⇒ unbounded (legacy).
    const semaphore = createSemaphore(config.maxConcurrentTasks);

    const taskPromises = tasks.map(async (task) => {
      await semaphore.acquire();
      try {
        await executeOneTask(task);
      } finally {
        semaphore.release();
      }
    });

    async function executeOneTask(task: PlannedTask): Promise<void> {
      if (includeTaskEvents) {
        stepEvents.push({
          type: 'workflow.task.start',
          stepNumber: internal.stepNumber,
          taskId: task.taskId,
          nodeName: task.nodeName,
        });
        wakeEventPump();
      }
      const start = Date.now();
      // WF-11: every executed task gets its advertised `workflow.task`
      // span - ok/error mirrors the task outcome.
      const taskSpan = tracer?.startSpan({
        type: 'workflow.task',
        attrs: {
          'graphorin.workflow.name': config.name,
          'graphorin.workflow.step_number': internal.stepNumber,
          'graphorin.workflow.node': task.nodeName,
          'graphorin.workflow.task_id': task.taskId,
        },
      });
      const ctxEmit = (name: string, payload?: unknown): void => {
        customEvents.push({
          type: 'workflow.custom',
          name,
          payload,
        });
        wakeEventPump();
      };

      // D1: per-task controller so a node timeout can abort ITS body
      // without touching siblings; outer aborts chain through.
      const perTaskController = new AbortController();
      const chainAbort = (): void => perTaskController.abort(taskController.signal.reason);
      if (taskController.signal.aborted) chainAbort();
      else taskController.signal.addEventListener('abort', chainAbort, { once: true });

      const ctx: WorkflowContext<TState> = Object.freeze({
        threadId,
        stepNumber: internal.stepNumber,
        taskId: task.taskId,
        signal: perTaskController.signal,
        emit: ctxEmit,
        state: stateView,
        ...(task.dispatchArgs !== undefined ? { dispatchArgs: task.dispatchArgs } : {}),
      });

      let writes: ChannelWrite[] = [];
      const dispatches: PlannedTask[] = [];
      let paused: { value: unknown } | undefined;
      let status: 'completed' | 'paused' | 'failed' = 'completed';
      try {
        const node = config.nodes[task.nodeName];
        if (!node) {
          throw new NodeExecutionError(task.nodeName, new Error('node not registered'));
        }
        // D1 / workflow-03: per-node timeout + bounded retry (node-level
        // fields override config.nodeDefaults; absent ⇒ legacy behaviour).
        const nodeOutput = await runNodeWithPolicy({
          node,
          ctx,
          task,
          timeoutMs: node.timeoutMs ?? config.nodeDefaults?.timeoutMs,
          retry: node.retry ?? config.nodeDefaults?.retry,
          stepController: taskController,
          taskController: perTaskController,
        });

        const harvested = harvestNodeOutput<TState>({
          nodeName: task.nodeName,
          taskId: task.taskId,
          output: nodeOutput,
        });
        writes = harvested.writes;
        for (const dispatch of harvested.dispatches) {
          dispatches.push({
            taskId: newId('task'),
            nodeName: dispatch.nodeName,
            source: 'dispatch',
            dispatchArgs: dispatch.args,
          });
        }
      } catch (err) {
        if (isPauseSignal(err)) {
          paused = { value: err.value };
          status = 'paused';
        } else if (isReplayDivergenceSignal(err)) {
          // W-120: nondeterministic pause order - fail LOUDLY with the
          // typed code instead of delivering a value to the wrong pause.
          status = 'failed';
          nodeFailure ??= {
            nodeName: task.nodeName,
            cause: new WorkflowError(
              'pause-replay-divergence',
              `node '${task.nodeName}' paused as ${describePauseIdentity(err.actual)} where the journal recorded ${describePauseIdentity(err.expected)} at cursor ${err.cursor}. The body's pause order depends on state/time/model output - make the branching between pauses deterministic, or key the waits by distinct awakeable names.`,
            ),
          };
        } else if (taskController.signal.aborted) {
          status = 'failed';
          nodeFailure ??= {
            nodeName: task.nodeName,
            cause: new WorkflowAbortedError(threadId, signalAbortReason(taskController.signal)),
          };
        } else {
          status = 'failed';
          nodeFailure ??= {
            nodeName: task.nodeName,
            cause: err,
          };
        }
      }

      taskSpan?.setStatus(status === 'failed' ? 'error' : 'ok');
      taskSpan?.end();
      const durationMs = Date.now() - start;
      taskOutcomes.push({
        task,
        writes,
        ...(paused !== undefined ? { paused } : {}),
        durationMs,
        status,
        pendingDispatches: dispatches,
      });

      if (includeTaskEvents) {
        stepEvents.push({
          type: 'workflow.task.end',
          stepNumber: internal.stepNumber,
          taskId: task.taskId,
          nodeName: task.nodeName,
          status: status === 'paused' ? 'paused' : status === 'failed' ? 'failed' : 'completed',
          durationMs,
        });
        wakeEventPump();
      }

      // Avoid leaking the chained listener when the step controller
      // outlives this task.
      taskController.signal.removeEventListener('abort', chainAbort);

      // D1 / workflow-04: journal this completed task's writes (plus a
      // done marker so zero-write completions are recoverable) against
      // the parent checkpoint, as soon as it finishes. Best-effort by
      // contract? No - a journal write failure must surface: silent loss
      // here would defeat the exactly-once recovery the flag promises.
      if (journalCheckpointId !== null && status === 'completed') {
        await config.checkpointStore.putWrites(
          threadId,
          namespace,
          journalCheckpointId,
          [
            ...writes.map((w, idx) => ({
              taskId: task.taskId,
              index: idx,
              channel: w.channel,
              value: w.value,
            })),
            {
              taskId: task.taskId,
              index: writes.length,
              channel: TASK_DONE_CHANNEL,
              value: true,
            },
          ],
          task.taskId,
        );
      }
    }

    let graceExpired = false;
    try {
      // WF-15: yield queued task/custom events as they arrive. The pump
      // sleeps on `notifyEventPump` and is woken by every push and by
      // step settle; the executor re-check closes the flip-between-
      // check-and-sleep race.
      let stepSettled = false;
      const settledPromise = waitForTasksOrTimeout(
        taskPromises,
        taskController.signal,
        cancelGraceMs,
      ).then((outcome) => {
        stepSettled = true;
        wakeEventPump();
        return outcome;
      });
      while (true) {
        while (stepEvents.length > 0) {
          const ev = stepEvents.shift();
          if (ev !== undefined) yield ev;
        }
        while (customEvents.length > 0) {
          const ev = customEvents.shift();
          if (ev !== undefined && includeCustomEvents) yield ev;
        }
        if (stepSettled) break;
        await new Promise<void>((resolve) => {
          notifyEventPump = resolve;
          if (stepSettled || stepEvents.length > 0 || customEvents.length > 0) {
            notifyEventPump = undefined;
            resolve();
          }
        });
      }
      graceExpired = (await settledPromise) === 'grace-expired';
    } finally {
      signal?.removeEventListener('abort', onSignalAbort);
    }

    // Tail drain: events enqueued between the last pump pass and settle.
    for (const ev of stepEvents.splice(0)) yield ev;
    for (const ev of customEvents.splice(0)) {
      if (includeCustomEvents) yield ev;
    }

    if (signal?.aborted && !nodeFailure) {
      // WF-11: a cancellation whose grace window expired with tasks
      // still unsettled is its own advertised failure mode - distinct
      // from a clean boundary abort.
      nodeFailure = {
        nodeName: tasks[0]?.nodeName ?? '<unknown>',
        cause: graceExpired
          ? new WorkflowError(
              'workflow-cancel-timeout',
              `cancellation grace (${cancelGraceMs}ms) expired with unsettled task(s) still running in workflow "${config.name}"`,
              {
                hint: 'tasks that ignore ctx.signal keep running in the background; raise cancelGraceMs or honour the signal in the node',
              },
            )
          : new WorkflowAbortedError(threadId, signalAbortReason(signal)),
      };
    }

    // workflow-02: apply channel writes in PLANNED task order, not
    // completion order - non-commutative merges (any-value, reducers,
    // list/stream appends) become deterministic under parallel async
    // nodes. `taskOutcomes` is completion-ordered; re-key by task id.
    const outcomeByTaskId = new Map(taskOutcomes.map((o) => [o.task.taskId, o] as const));
    const orderedOutcomes = tasks
      .map((t) => outcomeByTaskId.get(t.taskId))
      .filter((o): o is NonNullable<typeof o> => o !== undefined);

    // WF-1/WF-2 + workflow-08: collect EVERY pause raised this step
    // BEFORE the failure branch, so a sibling failure no longer drops
    // already-delivered pause answers - the failure frontier persists
    // them and `retry` replays them. Durable suspensions (timers /
    // awakeables / approvals, D1) stamp their wakeAt / name here.
    const pauseRecords: PendingPauseRecord[] = [];
    for (const outcome of orderedOutcomes) {
      if (outcome.paused === undefined) continue;
      const pauseValue = outcome.paused.value;
      pauseRecords.push({
        nodeName: outcome.task.nodeName,
        value: pauseValue,
        ...(outcome.task.dispatchArgs !== undefined
          ? { dispatchArgs: outcome.task.dispatchArgs }
          : {}),
        ...(outcome.task.resumeValues !== undefined && outcome.task.resumeValues.length > 0
          ? { satisfied: outcome.task.resumeValues }
          : {}),
        ...(outcome.task.resumeMeta !== undefined && outcome.task.resumeMeta.length > 0
          ? { satisfiedMeta: outcome.task.resumeMeta }
          : {}),
        ...(isTimerPauseValue(pauseValue) ? { wakeAt: pauseValue.wakeAt } : {}),
        ...(isAwakeablePauseValue(pauseValue) || isApprovalPauseValue(pauseValue)
          ? { name: pauseValue.name }
          : {}),
      });
    }

    if (nodeFailure) {
      const successWrites: ChannelWrite[] = [];
      for (const outcome of orderedOutcomes) {
        if (outcome.status === 'completed') {
          for (const w of outcome.writes) successWrites.push(w);
        }
      }
      // WF-3: an abort where every task still completed cleanly is a
      // boundary stop - persist 'aborted' (resumable), not 'failed'. A
      // task that actually died (even abort-induced) stays 'failed'.
      const anyTaskFailed = taskOutcomes.some((t) => t.status === 'failed');
      const failStatus: 'failed' | 'aborted' =
        signal?.aborted === true && !anyTaskFailed ? 'aborted' : 'failed';
      const outcomeByTask = new Map(taskOutcomes.map((o) => [o.task.taskId, o.status] as const));
      const checkpointId = await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: failStatus,
        nodeName: nodeFailure.nodeName,
        frontier: {
          v: 1,
          // workflow-08: paused tasks' records (incl. satisfied answers)
          // survive a sibling failure so retry can replay them.
          pauses: pauseRecords,
          dynamic: [],
          completed: [],
          ...(config.version !== undefined ? { version: config.version } : {}),
          // The full task list of the failed step - `retry` replays the
          // completed ones from `pendingWrites` and re-runs the rest.
          stepTasks: tasks.map((t) => ({
            taskId: t.taskId,
            nodeName: t.nodeName,
            status: outcomeByTask.get(t.taskId) ?? 'failed',
            ...(t.dispatchArgs !== undefined ? { dispatchArgs: t.dispatchArgs } : {}),
          })),
        },
        pendingWritesByTask: groupWritesByTask(successWrites),
      });
      stepSpan?.recordException(nodeFailure.cause);
      stepSpan?.setStatus('error');
      stepSpan?.end();
      if (includeCheckpointEvents && checkpointId !== null) {
        yield checkpointEvent<TState>(checkpointId, internal.stepNumber);
      }
      internal.status = failStatus;
      throw wrapNodeFailure(nodeFailure.nodeName, nodeFailure.cause);
    }

    const allWrites: ChannelWrite[] = [];
    const newDynamicTasks: PlannedTask[] = [];
    for (const outcome of orderedOutcomes) {
      if (outcome.status !== 'completed') continue;
      for (const w of outcome.writes) allWrites.push(w);
      for (const t of outcome.pendingDispatches) newDynamicTasks.push(t);
    }

    // workflow-05: a merge-time failure (MultiWriteError / ReducerError /
    // InvalidChannelWriteError) is a real step failure - persist the
    // terminal 'failed' checkpoint instead of leaking a 'running' thread
    // with an open step span.
    let applied: ReturnType<typeof applyWrites<TState>>;
    try {
      applied = applyWrites<TState>({
        state: internal.state,
        versions: internal.versions,
        channels,
        writes: allWrites,
      });
    } catch (err) {
      const checkpointId = await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: 'failed',
        nodeName: '<channel-merge>',
        frontier: frontierFromInternal(internal, config),
      });
      stepSpan?.recordException(err);
      stepSpan?.setStatus('error');
      stepSpan?.end();
      if (includeCheckpointEvents && checkpointId !== null) {
        yield checkpointEvent<TState>(checkpointId, internal.stepNumber);
      }
      internal.status = 'failed';
      throw err;
    }

    if (config.validateState !== undefined) {
      try {
        config.validateState(applied.state);
      } catch (err) {
        const checkpointId = await persistCheckpoint({
          config,
          namespace,
          threadId,
          internal,
          durability,
          status: 'failed',
          nodeName: '<state-validator>',
        });
        stepSpan?.recordException(err);
        stepSpan?.setStatus('error');
        stepSpan?.end();
        if (includeCheckpointEvents && checkpointId !== null) {
          yield checkpointEvent<TState>(checkpointId, internal.stepNumber);
        }
        internal.status = 'failed';
        throw new WorkflowError(
          'state-validation-failed',
          err instanceof Error ? err.message : String(err),
          { cause: err },
        );
      }
    }

    internal.state = applied.state;
    internal.versions = { ...applied.versions };
    if (includeChannelEvents) {
      for (const channelName of applied.changedChannels) {
        yield {
          type: 'workflow.channel.update',
          stepNumber: internal.stepNumber,
          channel: channelName as keyof TState & string,
          version: internal.versions[channelName] ?? 0,
          // workflow-07: ephemeral values are wiped from state before the
          // next round - this event is their one observation point.
          ...(channelName in applied.ephemeralValues
            ? { value: applied.ephemeralValues[channelName] }
            : {}),
        } satisfies WorkflowEvent<TState>;
      }
    }

    internal.lastCompletedNodes = orderedOutcomes
      .filter((t) => t.status === 'completed')
      .map((t) => t.task.nodeName);
    internal.pendingDynamicTasks = newDynamicTasks;

    let staticAfterPause: PendingPauseRecord | undefined;
    if (pauseRecords.length === 0) {
      const afterMatches = (config.pauseAt?.after ?? []).filter((nodeName) =>
        internal.lastCompletedNodes.includes(nodeName),
      );
      if (afterMatches.length > 0) {
        const node = afterMatches[0] as string;
        staticAfterPause = {
          nodeName: node,
          value: { kind: 'static-after', node },
          staticAfter: true,
        };
      }
    }

    const finalPauses =
      pauseRecords.length > 0 ? pauseRecords : staticAfterPause ? [staticAfterPause] : [];
    if (finalPauses.length > 0) {
      const first = finalPauses[0] as PendingPauseRecord;
      internal.pendingPauses = finalPauses;
      internal.status = 'suspended';
      const checkpointId = await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: 'suspended',
        nodeName: first.nodeName,
        frontier: frontierFromInternal(internal, config),
      });
      stepSpan?.setStatus('ok');
      stepSpan?.end();
      if (includeStepEvents) {
        yield {
          type: 'workflow.step.end',
          stepNumber: internal.stepNumber,
          state: internal.state,
        } satisfies WorkflowEvent<TState>;
      }
      if (includeCheckpointEvents && checkpointId !== null) {
        yield checkpointEvent<TState>(checkpointId, internal.stepNumber);
      }
      yield {
        type: 'workflow.suspended',
        threadId,
        stepNumber: internal.stepNumber,
        state: internal.state,
        value: first.value,
      } satisfies WorkflowEvent<TState>;
      internal.closed = true;
      return;
    }

    // WF-3: the step's 'running' checkpoint (with its frontier) is
    // persisted BEFORE `workflow.step.end` is reported - an abandoned
    // iterator / killed process can always recover the completed step.
    const checkpointId = await persistCheckpoint({
      config,
      namespace,
      threadId,
      internal,
      durability,
      status: 'running',
      frontier: frontierFromInternal(internal, config),
    });
    stepSpan?.setStatus('ok');
    stepSpan?.end();
    if (includeStepEvents) {
      yield {
        type: 'workflow.step.end',
        stepNumber: internal.stepNumber,
        state: internal.state,
      } satisfies WorkflowEvent<TState>;
    }
    if (includeCheckpointEvents && checkpointId !== null) {
      yield checkpointEvent<TState>(checkpointId, internal.stepNumber);
    }
    // WF-8: under `durability: 'exit'` the running put is skipped - the
    // parent pointer must keep referencing the last checkpoint that
    // actually exists in the store.
    if (checkpointId !== null) {
      internal.parentCheckpointId = checkpointId;
    }
    internal.stepNumber += 1;

    if (signal?.aborted) {
      // workflow-12: mirror the loop-top contract - the step's 'running'
      // checkpoint was just written, so stamp the terminal status too.
      internal.status = 'aborted';
      await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: 'aborted',
        frontier: frontierFromInternal(internal, config),
      });
      throw new WorkflowAbortedError(threadId, signalAbortReason(signal));
    }
  }
}

function planTasks<TState extends object>(
  config: WorkflowConfig<TState>,
  internal: RunInternalState<TState>,
): {
  readonly tasks: PlannedTask[];
  readonly suspendBefore?: {
    readonly nodeName: string;
    readonly dispatchArgs?: unknown;
    readonly rest: PlannedTask[];
  };
  readonly deadEnd?: string[];
} {
  const planned: PlannedTask[] = [];
  for (const task of internal.pendingDynamicTasks) planned.push(task);
  internal.pendingDynamicTasks = [];

  const fromCompleted = internal.lastCompletedNodes;
  internal.lastCompletedNodes = [];

  const reachable: string[] = [];
  for (const nodeName of fromCompleted) {
    const matches = config.edges.filter((e) => e.from === nodeName);
    for (const edge of matches) {
      if (edge.to === END_NODE) continue;
      if (edge.when !== undefined && !edge.when(internal.state)) continue;
      reachable.push(edge.to);
    }
  }

  for (const nodeName of reachable) {
    if (planned.some((t) => t.nodeName === nodeName)) continue;
    // WF-5: a node fed by 2+ writers of one Barrier channel is a join -
    // defer it until EVERY writer in the barrier's `from` has written.
    // The last writer's completion re-fires its edge, so the join runs
    // exactly once, with the complete map.
    if (barrierDefersNode(config, internal.state, nodeName)) continue;
    planned.push({
      taskId: newId('task'),
      nodeName,
      source: 'edge',
    });
  }

  const before = config.pauseAt?.before ?? [];
  for (const task of planned) {
    if (task.source === 'resume' || task.staticBefore === true) continue;
    if (before.includes(task.nodeName)) {
      return {
        tasks: [],
        suspendBefore: {
          nodeName: task.nodeName,
          ...(task.dispatchArgs !== undefined ? { dispatchArgs: task.dispatchArgs } : {}),
          // Everything else planned for this step survives the suspension.
          rest: planned.filter((t) => t !== task),
        },
      };
    }
  }

  if (planned.length === 0 && fromCompleted.length > 0) {
    if (reachableEnd(config, fromCompleted, internal.state)) {
      return { tasks: [] };
    }
    // WF-14 + workflow-06: nothing fired and no END edge is satisfied -
    // a dead end. The bootstrap round is no longer excluded: an
    // all-false conditional fan out of __start__ raises instead of
    // silently completing a workflow that never ran a node.
    return { tasks: [], deadEnd: [...fromCompleted] };
  }

  return { tasks: planned };
}

/**
 * WF-5 join gate. A node is barrier-gated when at least two of its
 * in-edge sources are writers of the same Barrier channel - the
 * declared fan-in join shape. Single-writer edges never defer, so a
 * barrier writer's unrelated out-edges keep firing normally.
 */
function barrierDefersNode<TState extends object>(
  config: WorkflowConfig<TState>,
  state: TState,
  nodeName: string,
): boolean {
  for (const [channelName, descriptor] of Object.entries(
    config.channels as Readonly<Record<string, Channel<unknown>>>,
  )) {
    if (descriptor.kind !== 'barrier') continue;
    const from = descriptor.from;
    const joinSources = new Set(
      config.edges.filter((e) => e.to === nodeName && from.includes(e.from)).map((e) => e.from),
    );
    if (joinSources.size < 2) continue;
    const raw = (state as Record<string, unknown>)[channelName];
    const map: Record<string, unknown> =
      typeof raw === 'object' && raw !== null && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    if (!from.every((writer) => writer in map)) return true;
  }
  return false;
}

function reachableEnd<TState extends object>(
  config: WorkflowConfig<TState>,
  fromCompleted: ReadonlyArray<string>,
  state: TState,
): boolean {
  for (const nodeName of fromCompleted) {
    for (const edge of config.edges) {
      if (edge.from !== nodeName) continue;
      if (edge.to !== END_NODE) continue;
      if (edge.when !== undefined && !edge.when(state)) continue;
      return true;
    }
  }
  // WF-14: completion must be EARNED by a satisfied END edge - the old
  // vacuous `return true` here silently completed dead-ended graphs.
  return false;
}

interface HarvestResult<TState> {
  readonly writes: ChannelWrite[];
  readonly dispatches: ReadonlyArray<DispatchLike>;
  readonly _state?: TState;
}

function harvestNodeOutput<TState>(input: {
  readonly nodeName: string;
  readonly taskId: string;
  readonly output: unknown;
}): HarvestResult<TState> {
  const writes: ChannelWrite[] = [];
  const dispatches: DispatchLike[] = [];
  let index = 0;

  function consume(value: unknown): void {
    if (value === undefined || value === null) return;
    if (value instanceof Dispatch) {
      dispatches.push(value);
      return;
    }
    if (isDispatchLike(value)) {
      dispatches.push(value);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) consume(item);
      return;
    }
    if (typeof value === 'object') {
      for (const [channel, channelValue] of Object.entries(value as Record<string, unknown>)) {
        if (channelValue === undefined) continue;
        writes.push({
          nodeName: input.nodeName,
          taskId: input.taskId,
          index: index++,
          channel,
          value: channelValue,
        });
      }
    }
  }

  consume(input.output);
  return { writes, dispatches };
}

function isDispatchLike(value: unknown): value is DispatchLike {
  // workflow-13: the structural fallback (for Dispatch values that
  // crossed a realm boundary and lost their prototype) now requires the
  // cross-realm brand - a plain state object that happens to carry
  // `nodeName` + `args` keys is channel WRITES, never a dispatch.
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { __graphorinDispatch?: unknown }).__graphorinDispatch === true &&
    typeof (value as { nodeName?: unknown }).nodeName === 'string' &&
    'args' in value
  );
}

async function runResumedNode<TState extends object>(
  node: WorkflowNode<TState>,
  ctx: WorkflowContext<TState>,
  resumeValues: ReadonlyArray<unknown>,
  resumeMeta?: ReadonlyArray<{ readonly kind?: string; readonly name?: string } | null>,
): Promise<unknown> {
  return runWithPauseResume(resumeValues, async () => node.run(ctx.state, ctx), resumeMeta);
}

function directiveUpdateToWrites(nodeName: string, update: unknown): ChannelWrite[] {
  if (typeof update !== 'object' || update === null) return [];
  let index = 0;
  return Object.entries(update as Record<string, unknown>).map(([channel, value]) => ({
    nodeName,
    taskId: '__directive__',
    index: index++,
    channel,
    value,
  }));
}

function groupWritesByTask(writes: ReadonlyArray<ChannelWrite>): Map<string, ChannelWrite[]> {
  const out = new Map<string, ChannelWrite[]>();
  for (const w of writes) {
    const list = out.get(w.taskId) ?? [];
    list.push(w);
    out.set(w.taskId, list);
  }
  return out;
}

/**
 * WF-9 helper: freeze a structured clone in depth so node bodies cannot
 * mutate the shared step snapshot. Cycle-safe (structuredClone output
 * may contain cycles).
 */
function deepFreeze(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value !== 'object' || value === null) return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const inner of Object.values(value)) deepFreeze(inner, seen);
  return Object.freeze(value);
}

interface PersistCheckpointArgs<TState extends object> {
  readonly config: WorkflowConfig<TState>;
  readonly namespace: string;
  readonly threadId: string;
  readonly internal: RunInternalState<TState>;
  readonly durability: DurabilityMode;
  readonly status: CheckpointMetadata['status'];
  readonly nodeName?: string;
  readonly frontier?: FrontierEnvelope;
  readonly pendingWritesByTask?: Map<string, ChannelWrite[]>;
}

/**
 * Persist one checkpoint. Returns the new checkpoint id, or `null` when
 * the configured durability mode skipped the put (WF-8) - callers must
 * not report or parent-link a checkpoint that does not exist.
 *
 * WF-12: before writing, the latest stored checkpoint is compared
 * against the run's parent pointer - if another writer advanced the
 * thread in between, a `checkpoint-version-conflict` error is thrown
 * instead of forking the timeline.
 */
async function persistCheckpoint<TState extends object>(
  args: PersistCheckpointArgs<TState>,
): Promise<string | null> {
  const { config, namespace, threadId, internal, durability, status, nodeName } = args;
  const checkpointId = newId('cp');
  const now = new Date().toISOString();
  // W-121: everything that rides the frontier tags must survive the
  // JSON round-trip - same fail-fast as `serializeState` (WF-10).
  if (args.frontier !== undefined) assertFrontierJsonSafe(args.frontier);
  const tags = args.frontier ? encodeFrontier(args.frontier) : undefined;

  const skipPut = durability === 'exit' && status === 'running';

  if (!skipPut) {
    const latest = await config.checkpointStore.getTuple(threadId, namespace);
    if (latest) {
      if (internal.parentCheckpointId !== undefined) {
        if (latest.checkpoint.id !== internal.parentCheckpointId) {
          throw new CheckpointVersionConflictError(
            threadId,
            internal.parentCheckpointId,
            latest.checkpoint.id,
          );
        }
      } else if (latest.metadata.status === 'running' || latest.metadata.status === 'suspended') {
        // A fresh run may overwrite a terminal thread, but never an
        // active one.
        throw new CheckpointVersionConflictError(threadId, '<fresh-run>', latest.checkpoint.id);
      }
    }
  }

  const stateForPersist = serializeState(internal.state);

  // WF-11: persisted checkpoints get their advertised
  // `workflow.checkpoint` span; skipped ('exit'-mode running) puts
  // record nothing.
  const checkpointSpan = skipPut
    ? undefined
    : config.tracer?.startSpan({
        type: 'workflow.checkpoint',
        attrs: {
          'graphorin.workflow.thread_id': threadId,
          'graphorin.workflow.step_number': internal.stepNumber,
          'graphorin.workflow.checkpoint_status': status,
        },
      });

  const checkpoint: Checkpoint = {
    id: checkpointId,
    threadId,
    namespace,
    ...(internal.parentCheckpointId !== undefined ? { parentId: internal.parentCheckpointId } : {}),
    state: stateForPersist,
    channelVersions: { ...internal.versions },
    stepNumber: internal.stepNumber,
    createdAt: now,
  };
  // W-032: stamp the earliest frontier timer on suspended checkpoints so
  // `CheckpointStore.listSuspended` can enumerate due threads without
  // parsing the frontier tags.
  const wakeAt =
    status === 'suspended' && args.frontier !== undefined
      ? args.frontier.pauses.reduce<number | undefined>((min, p) => {
          const w = (p as { readonly wakeAt?: unknown }).wakeAt;
          if (typeof w !== 'number') return min;
          return min === undefined || w < min ? w : min;
        }, undefined)
      : undefined;
  const metadata: CheckpointMetadata = {
    source: durability,
    status,
    ...(nodeName !== undefined ? { nodeName } : {}),
    ...(tags !== undefined ? { tags } : {}),
    ...(wakeAt !== undefined ? { wakeAt } : {}),
  };

  try {
    if (!skipPut) {
      // workflow-01: stores that honour `expectedLatestId` perform the
      // compare-and-set atomically, closing the TOCTOU window of the
      // pre-check above; legacy stores ignore the extra argument and the
      // pre-check remains the (best-effort) guard.
      await config.checkpointStore.put(
        threadId,
        namespace,
        checkpoint,
        metadata,
        internal.parentCheckpointId !== undefined
          ? { expectedLatestId: internal.parentCheckpointId }
          : {},
      );
    }

    if (args.pendingWritesByTask) {
      for (const [taskId, writes] of args.pendingWritesByTask) {
        await config.checkpointStore.putWrites(
          threadId,
          namespace,
          checkpointId,
          writes.map((w, idx) => ({
            taskId: w.taskId,
            index: idx,
            channel: w.channel,
            value: w.value,
          })),
          taskId,
        );
      }
    }
  } catch (err) {
    checkpointSpan?.setStatus('error');
    checkpointSpan?.end();
    if (err instanceof CheckpointConflictError) {
      throw new CheckpointVersionConflictError(
        threadId,
        err.expectedLatestId ?? '<fresh-run>',
        err.actualLatestId ?? '<none>',
      );
    }
    throw err;
  }
  checkpointSpan?.setStatus('ok');
  checkpointSpan?.end();

  return skipPut ? null : checkpointId;
}

function checkpointEvent<TState>(checkpointId: string, stepNumber: number): WorkflowEvent<TState> {
  return {
    type: 'workflow.checkpoint.written',
    checkpointId,
    stepNumber,
  };
}

function emitError<TState>(threadId: string, err: unknown): WorkflowEvent<TState> {
  if (err instanceof WorkflowError) {
    return {
      type: 'workflow.error',
      threadId,
      error: { message: err.message, code: err.code },
    };
  }
  return {
    type: 'workflow.error',
    threadId,
    error: {
      message: err instanceof Error ? err.message : String(err),
      code: 'node-execution-failed',
    },
  };
}

function wrapNodeFailure(nodeName: string, cause: unknown): WorkflowError {
  if (cause instanceof WorkflowError) return cause;
  return new NodeExecutionError(nodeName, cause);
}

function signalAbortReason(signal: AbortSignal): string {
  const reason = (signal as { reason?: unknown }).reason;
  if (reason === undefined) return 'aborted';
  if (typeof reason === 'string') return reason;
  if (reason instanceof Error) return reason.message;
  return 'aborted';
}

/** Reserved journal keys for opt-in step journaling (D1 / workflow-04). */
const STEP_INTENT_TASK_ID = '__graphorin_step_intent__' as const;
const STEP_INTENT_CHANNEL = '__graphorin_step_intent__' as const;
const TASK_DONE_CHANNEL = '__graphorin_task_done__' as const;

interface StepIntentTask {
  readonly taskId: string;
  readonly nodeName: string;
  readonly source: PlannedTask['source'];
  readonly dispatchArgs?: unknown;
  readonly resumeValues?: ReadonlyArray<unknown>;
  /** W-120: identity of the pause each resume value answers. */
  readonly resumeMeta?: ReadonlyArray<{ readonly kind?: string; readonly name?: string } | null>;
  readonly staticBefore?: boolean;
}

/**
 * D1 / workflow-04: decode the interrupted step's journal from the
 * latest checkpoint's pending writes. Returns `null` when no intent for
 * the expected step is journaled (crash happened outside a journaled
 * step, or journaling was off) - the caller then falls back to the
 * plain frontier fan-out.
 */
function readStepJournal(
  tuple: {
    readonly pendingWrites?: ReadonlyArray<{
      readonly taskId: string;
      readonly index: number;
      readonly channel: string;
      readonly value: unknown;
    }>;
  },
  expectedStepNumber: number,
): {
  readonly replayWrites: ChannelWrite[];
  readonly completedNodes: string[];
  readonly rerunTasks: PlannedTask[];
} | null {
  const rows = tuple.pendingWrites ?? [];
  const intentRow = rows.find(
    (r) => r.taskId === STEP_INTENT_TASK_ID && r.channel === STEP_INTENT_CHANNEL,
  );
  if (intentRow === undefined) return null;
  const intent = intentRow.value as {
    v?: number;
    stepNumber?: number;
    tasks?: ReadonlyArray<StepIntentTask>;
  };
  if (intent?.v !== 1 || intent.stepNumber !== expectedStepNumber) return null;
  const tasks = Array.isArray(intent.tasks) ? intent.tasks : [];
  if (tasks.length === 0) return null;

  const doneIds = new Set(rows.filter((r) => r.channel === TASK_DONE_CHANNEL).map((r) => r.taskId));
  const nameByTask = new Map(tasks.map((t) => [t.taskId, t.nodeName] as const));
  const replayWrites: ChannelWrite[] = [];
  // Replay in intent (planned) order for workflow-02 determinism.
  for (const t of tasks) {
    if (!doneIds.has(t.taskId)) continue;
    for (const row of rows) {
      if (row.taskId !== t.taskId || row.channel === TASK_DONE_CHANNEL) continue;
      replayWrites.push({
        nodeName: nameByTask.get(row.taskId) ?? '<replay>',
        taskId: row.taskId,
        index: row.index,
        channel: row.channel,
        value: row.value,
      });
    }
  }
  const completedNodes = tasks.filter((t) => doneIds.has(t.taskId)).map((t) => t.nodeName);
  const rerunTasks: PlannedTask[] = tasks
    .filter((t) => !doneIds.has(t.taskId))
    .map((t) => ({
      taskId: newId('task'),
      nodeName: t.nodeName,
      source: t.source === 'resume' ? ('resume' as const) : ('dispatch' as const),
      ...(t.dispatchArgs !== undefined ? { dispatchArgs: t.dispatchArgs } : {}),
      ...(t.resumeValues !== undefined ? { resumeValues: [...t.resumeValues] } : {}),
      ...(t.resumeMeta !== undefined ? { resumeMeta: [...t.resumeMeta] } : {}),
      ...(t.staticBefore === true ? { staticBefore: true } : {}),
    }));
  return { replayWrites, completedNodes, rerunTasks };
}

/**
 * D1 / workflow-10: minimal counting semaphore for the per-step task
 * pool. `limit` undefined / non-positive ⇒ unbounded (a no-op acquire).
 */
function createSemaphore(limit: number | undefined): {
  acquire(): Promise<void>;
  release(): void;
} {
  if (limit === undefined || !Number.isFinite(limit) || limit < 1) {
    return { acquire: async () => {}, release: () => {} };
  }
  let inFlight = 0;
  const waiters: Array<() => void> = [];
  return {
    async acquire(): Promise<void> {
      if (inFlight < limit) {
        inFlight += 1;
        return;
      }
      await new Promise<void>((resolve) => {
        waiters.push(resolve);
      });
      inFlight += 1;
    },
    release(): void {
      inFlight -= 1;
      const next = waiters.shift();
      next?.();
    },
  };
}

/**
 * D1 / workflow-03: run a node body under its per-node policy.
 *
 * - `timeoutMs` is a hard per-TASK wall-clock budget: on expiry the
 *   task's own controller aborts (so a well-behaved body can stop) and
 *   the task fails with `node-timeout`. Bodies that ignore the signal
 *   keep running in the background - the same contract as cancellation.
 * - `retry` re-invokes the body on thrown failures only: `pause(...)`
 *   suspensions, step-level aborts, and timeouts never retry. Backoff
 *   doubles per attempt and counts against the timeout budget.
 */
async function runNodeWithPolicy<TState extends object>(args: {
  readonly node: WorkflowNode<TState>;
  readonly ctx: WorkflowContext<TState>;
  readonly task: PlannedTask;
  readonly timeoutMs: number | undefined;
  readonly retry: WorkflowNodeRetryPolicy | undefined;
  readonly stepController: AbortController;
  readonly taskController: AbortController;
}): Promise<unknown> {
  const { node, ctx, task, timeoutMs, retry, stepController, taskController } = args;
  const maxAttempts = Math.max(1, Math.floor(retry?.maxAttempts ?? 1));
  const backoffBase = Math.max(0, retry?.backoffMs ?? 250);

  const invoke = async (): Promise<unknown> => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (task.source === 'resume') {
          return await runResumedNode(node, ctx, task.resumeValues ?? [], task.resumeMeta);
        }
        return await Promise.resolve(node.run(ctx.state, ctx));
      } catch (err) {
        if (isPauseSignal(err)) throw err;
        if (stepController.signal.aborted || taskController.signal.aborted) throw err;
        lastError = err;
        if (attempt >= maxAttempts) throw err;
        const backoff = backoffBase * 2 ** (attempt - 1);
        if (backoff > 0) {
          await abortableDelay(backoff, taskController.signal);
          if (taskController.signal.aborted) throw err;
        }
      }
    }
    throw lastError;
  };

  if (timeoutMs === undefined || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return invoke();
  }
  let timeoutId: NodeJS.Timeout | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const timeoutError = new NodeTimeoutError(task.nodeName, timeoutMs);
      taskController.abort(timeoutError);
      reject(timeoutError);
    }, timeoutMs);
  });
  try {
    return await Promise.race([invoke(), timedOut]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const id = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(id);
      resolve();
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

const PAUSE_TAG_PREFIX = 'pause:' as const;
const FRONTIER_TAG_PREFIX = 'frontier:' as const;

/**
 * The resumable frontier persisted with every checkpoint (WF-1/2/3):
 * everything the engine had in flight at persist time.
 */
interface FrontierEnvelope {
  readonly v: 1;
  /** Workflow definition version pin at persist time (D1). */
  readonly version?: string;
  /** Every pause raised by the suspension - parallel pausers included. */
  readonly pauses: ReadonlyArray<PendingPauseRecord>;
  /** Dispatch-scheduled tasks that have not run yet. */
  readonly dynamic: ReadonlyArray<{ readonly nodeName: string; readonly dispatchArgs?: unknown }>;
  /** Nodes that completed but whose outgoing edges were not walked yet. */
  readonly completed: ReadonlyArray<string>;
  /** Task list of a failed step - drives `retry` replay (WF-3/WF-6). */
  readonly stepTasks?: ReadonlyArray<{
    readonly taskId: string;
    readonly nodeName: string;
    readonly status: 'completed' | 'failed' | 'paused';
    readonly dispatchArgs?: unknown;
  }>;
}

function emptyFrontier(): FrontierEnvelope {
  return { v: 1, pauses: [], dynamic: [], completed: [] };
}

function frontierFromInternal<TState extends object>(
  internal: RunInternalState<TState>,
  config?: { readonly version?: string },
): FrontierEnvelope {
  return {
    v: 1,
    ...(config?.version !== undefined ? { version: config.version } : {}),
    pauses: [...internal.pendingPauses],
    dynamic: internal.pendingDynamicTasks.map((t) => ({
      nodeName: t.nodeName,
      ...(t.dispatchArgs !== undefined ? { dispatchArgs: t.dispatchArgs } : {}),
    })),
    completed: [...internal.lastCompletedNodes],
  };
}

/**
 * W-121: fail-fast walk of every frontier payload that will be
 * `JSON.stringify`-ed into checkpoint tags: pause values (incl.
 * approval payloads), dispatchArgs, satisfied resume values and their
 * metas, dynamic-task args, and the failure-frontier stepTasks args.
 * Offenders throw the same typed `state-not-serializable` as channel
 * state, with a pseudo-channel naming the pause/task.
 */
function assertFrontierJsonSafe(frontier: FrontierEnvelope): void {
  const fail = (channel: string, offender: { path: string; kind: string }): never => {
    throw new StateNotSerializableError(channel, offender.path, offender.kind);
  };
  for (const p of frontier.pauses) {
    const channel = `<pause:${p.nodeName}>`;
    let offender = findNonJsonSafe(p.value, `${channel}.value`);
    if (offender !== null) fail(channel, offender);
    offender = findNonJsonSafe(p.dispatchArgs, `${channel}.dispatchArgs`);
    if (offender !== null) fail(channel, offender);
    const satisfied = p.satisfied ?? [];
    for (let i = 0; i < satisfied.length; i += 1) {
      offender = findNonJsonSafe(satisfied[i], `${channel}.satisfied[${i}]`);
      if (offender !== null) fail(channel, offender);
    }
    const satisfiedMeta = p.satisfiedMeta ?? [];
    for (let i = 0; i < satisfiedMeta.length; i += 1) {
      offender = findNonJsonSafe(satisfiedMeta[i], `${channel}.satisfiedMeta[${i}]`);
      if (offender !== null) fail(channel, offender);
    }
  }
  for (const d of frontier.dynamic) {
    const channel = `<dispatch:${d.nodeName}>`;
    const offender = findNonJsonSafe(d.dispatchArgs, `${channel}.dispatchArgs`);
    if (offender !== null) fail(channel, offender);
  }
  for (const task of frontier.stepTasks ?? []) {
    const channel = `<task:${task.nodeName}>`;
    const offender = findNonJsonSafe(task.dispatchArgs, `${channel}.dispatchArgs`);
    if (offender !== null) fail(channel, offender);
  }
}

function encodeFrontier(frontier: FrontierEnvelope): string[] {
  const tags = [`${FRONTIER_TAG_PREFIX}${JSON.stringify(frontier)}`];
  // Keep writing the legacy single-pause tag so pre-frontier readers
  // (`Workflow.getState`, external tooling) keep seeing the first pause.
  const first = frontier.pauses[0];
  if (first) {
    tags.push(`${PAUSE_TAG_PREFIX}${JSON.stringify(first)}`);
  }
  return tags;
}

export function readFrontier(metadata: CheckpointMetadata): FrontierEnvelope {
  const frontierTag = metadata.tags?.find((t) => t.startsWith(FRONTIER_TAG_PREFIX));
  if (frontierTag) {
    try {
      const parsed = JSON.parse(
        frontierTag.slice(FRONTIER_TAG_PREFIX.length),
      ) as Partial<FrontierEnvelope>;
      return {
        v: 1,
        ...(typeof parsed.version === 'string' ? { version: parsed.version } : {}),
        pauses: Array.isArray(parsed.pauses)
          ? parsed.pauses.filter((p) => typeof p?.nodeName === 'string')
          : [],
        dynamic: Array.isArray(parsed.dynamic)
          ? parsed.dynamic.filter((d) => typeof d?.nodeName === 'string')
          : [],
        completed: Array.isArray(parsed.completed)
          ? parsed.completed.filter((c): c is string => typeof c === 'string')
          : [],
        ...(Array.isArray(parsed.stepTasks)
          ? {
              stepTasks: parsed.stepTasks.filter(
                (t) => typeof t?.taskId === 'string' && typeof t?.nodeName === 'string',
              ),
            }
          : {}),
      };
    } catch {
      // fall through to the legacy tag
    }
  }
  const legacy = readLegacyPendingPause(metadata);
  return {
    v: 1,
    pauses: legacy ? [legacy] : [],
    dynamic: [],
    completed: [],
  };
}

function readLegacyPendingPause(metadata: CheckpointMetadata): PendingPauseRecord | undefined {
  const tag = metadata.tags?.find((t) => t.startsWith(PAUSE_TAG_PREFIX));
  if (!tag) return undefined;
  try {
    const json = tag.slice(PAUSE_TAG_PREFIX.length);
    const parsed = JSON.parse(json) as Partial<PendingPauseRecord> & { nodeName?: string };
    if (typeof parsed.nodeName !== 'string') return undefined;
    return {
      nodeName: parsed.nodeName,
      value: parsed.value,
      ...(parsed.dispatchArgs !== undefined ? { dispatchArgs: parsed.dispatchArgs } : {}),
      ...(parsed.staticBefore ? { staticBefore: true } : {}),
      ...(parsed.staticAfter ? { staticAfter: true } : {}),
      ...(Array.isArray(parsed.satisfied) ? { satisfied: parsed.satisfied } : {}),
      ...(Array.isArray(parsed.satisfiedMeta) ? { satisfiedMeta: parsed.satisfiedMeta } : {}),
    };
  } catch {
    return undefined;
  }
}

function restoreState<TState extends object>(
  checkpoint: Checkpoint,
  channels: Readonly<Record<string, Channel<unknown>>>,
): { state: TState; versions: Record<string, number> } {
  void channels;
  const raw = unwrapPersistedState(checkpoint.state);
  const state: TState =
    typeof raw === 'object' && raw !== null
      ? ({ ...(raw as Record<string, unknown>) } as TState)
      : ({} as TState);
  const versions: Record<string, number> = { ...checkpoint.channelVersions };
  return { state, versions };
}

/**
 * @internal - restore a `Workflow.fork` clone. Copies the source
 * thread's state into a fresh thread id while leaving the original
 * timeline untouched.
 */
export async function forkThread<TState extends object>(input: {
  readonly config: WorkflowConfig<TState>;
  readonly threadId: string;
  readonly fromCheckpointId: string;
}): Promise<{ readonly newThreadId: string }> {
  const namespace = namespaceFor(input.config);
  const tuple = await input.config.checkpointStore.getTuple(
    input.threadId,
    namespace,
    input.fromCheckpointId,
  );
  if (!tuple) throw new CheckpointNotFoundError(input.threadId, input.fromCheckpointId);

  const newThreadId = newId('thread');
  const newCheckpointId = newId('cp');
  // WF-17: the forked root is self-contained - its parentId must NOT
  // dangle into the source thread (the parent only exists there).
  const { parentId: _droppedParentId, ...rest } = tuple.checkpoint;
  const newCheckpoint: Checkpoint = {
    ...rest,
    id: newCheckpointId,
    threadId: newThreadId,
    namespace,
  };
  await input.config.checkpointStore.put(newThreadId, namespace, newCheckpoint, {
    source: 'sync',
    status: tuple.metadata.status,
    ...(tuple.metadata.nodeName !== undefined ? { nodeName: tuple.metadata.nodeName } : {}),
    ...(tuple.metadata.tags !== undefined ? { tags: [...tuple.metadata.tags] } : {}),
  });
  // WF-17: pending writes ride along - a forked 'failed'/'aborted'
  // checkpoint stays `retry()`-able without re-running (or losing) the
  // tasks that already succeeded.
  const writes = tuple.pendingWrites ?? [];
  if (writes.length > 0) {
    const byTask = new Map<string, Array<(typeof writes)[number]>>();
    for (const write of writes) {
      const bucket = byTask.get(write.taskId) ?? [];
      bucket.push(write);
      byTask.set(write.taskId, bucket);
    }
    for (const [taskId, taskWrites] of byTask) {
      await input.config.checkpointStore.putWrites(
        newThreadId,
        namespace,
        newCheckpointId,
        taskWrites.map((w, idx) => ({
          taskId: w.taskId,
          index: idx,
          channel: w.channel,
          value: w.value,
        })),
        taskId,
      );
    }
  }
  return { newThreadId };
}

/**
 * Schema version embedded in every persisted checkpoint envelope.
 * Bumping the major part requires a documented migration path; the
 * minor part is reserved for additive fields the engine can ignore
 * when reading older checkpoints.
 */
export const CHECKPOINT_SCHEMA_VERSION = 'graphorin-workflow-checkpoint/1.0' as const;

interface PersistedStateEnvelope {
  readonly schema: typeof CHECKPOINT_SCHEMA_VERSION;
  readonly state: unknown;
}

function serializeState<TState extends object>(state: TState): PersistedStateEnvelope {
  // WF-10: checkpoint state must be JSON-safe on EVERY store. The
  // in-memory store would happily structuredClone a Map/Set/Date that
  // the production SQLite store JSON.stringify-es into junk - fail
  // fast and identically instead of corrupting silently later.
  for (const [channel, value] of Object.entries(state as Record<string, unknown>)) {
    const offender = findNonJsonSafe(value, channel);
    if (offender !== null) {
      throw new StateNotSerializableError(channel, offender.path, offender.kind);
    }
  }
  return {
    schema: CHECKPOINT_SCHEMA_VERSION,
    state: structuredClone(state),
  };
}

/**
 * Depth-first JSON-safety walk. Returns the path + kind of the first
 * value that `JSON.stringify` would degrade without an error, or
 * `null` when the value round-trips faithfully. `undefined` is
 * tolerated (a dropped key restores as an absent optional property).
 */
function findNonJsonSafe(
  value: unknown,
  path: string,
  seen = new WeakSet<object>(),
): { path: string; kind: string } | null {
  if (value === null || value === undefined) return null;
  const t = typeof value;
  if (t === 'string' || t === 'boolean') return null;
  if (t === 'number') {
    return Number.isFinite(value as number) ? null : { path, kind: 'non-finite number' };
  }
  if (t === 'bigint' || t === 'function' || t === 'symbol') return { path, kind: t };
  if (t !== 'object') return { path, kind: t };
  const obj = value as object;
  if (seen.has(obj)) return { path, kind: 'circular reference' };
  seen.add(obj);
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const inner = findNonJsonSafe(obj[i], `${path}[${i}]`, seen);
      if (inner !== null) return inner;
    }
    return null;
  }
  if (obj instanceof Map) return { path, kind: 'Map' };
  if (obj instanceof Set) return { path, kind: 'Set' };
  if (obj instanceof Date) return { path, kind: 'Date' };
  if (obj instanceof RegExp) return { path, kind: 'RegExp' };
  if (ArrayBuffer.isView(obj) || obj instanceof ArrayBuffer) {
    return { path, kind: 'binary buffer' };
  }
  const proto = Object.getPrototypeOf(obj);
  if (proto !== Object.prototype && proto !== null) {
    return { path, kind: `class instance (${obj.constructor?.name ?? 'unknown'})` };
  }
  for (const [key, inner] of Object.entries(obj)) {
    const found = findNonJsonSafe(inner, `${path}.${key}`, seen);
    if (found !== null) return found;
  }
  return null;
}

export function unwrapPersistedState(raw: unknown): unknown {
  // Versioned envelope. Older alpha/dev checkpoints written before the
  // envelope existed unwrap as the raw object - we accept either shape
  // so existing data on disk does not have to be discarded.
  if (typeof raw === 'object' && raw !== null) {
    const record = raw as { schema?: unknown; state?: unknown };
    if (typeof record.schema === 'string' && record.schema === CHECKPOINT_SCHEMA_VERSION) {
      return record.state;
    }
  }
  return raw;
}

/**
 * Race the per-step task promises against an abort timeout. When the
 * supplied signal aborts AND the tasks do not settle within
 * `cancelGraceMs`, the helper resolves anyway so the engine can record
 * a `workflow-aborted` failure and persist the last clean checkpoint.
 * Tasks that ignore the signal continue running in the background;
 * documenting that behaviour is part of the cancellation contract.
 */
function waitForTasksOrTimeout(
  tasks: ReadonlyArray<Promise<unknown>>,
  signal: AbortSignal,
  cancelGraceMs: number,
): Promise<'settled' | 'grace-expired'> {
  const settled = Promise.allSettled(tasks).then(() => 'settled' as const);
  if (signal.aborted) {
    return Promise.race([settled, deadline(cancelGraceMs).then(() => 'grace-expired' as const)]);
  }
  let timeoutId: NodeJS.Timeout | undefined;
  const onAbortDeadline = new Promise<'grace-expired'>((resolve) => {
    const trigger = (): void => {
      timeoutId = setTimeout(() => resolve('grace-expired'), cancelGraceMs);
    };
    signal.addEventListener('abort', trigger, { once: true });
  });
  return Promise.race([settled, onAbortDeadline]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
}

function deadline(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}
