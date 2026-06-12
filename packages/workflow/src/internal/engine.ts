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
 * *frontier envelope* in `metadata.tags` — the full set of pending pauses,
 * dynamic tasks, and completed-but-unwalked nodes — so a resume (or a
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
import { Dispatch, isPauseSignal, runWithPauseResume } from '@graphorin/core';

import {
  CheckpointNotFoundError,
  CheckpointVersionConflictError,
  ConcurrentResumeError,
  DeadEndError,
  NodeExecutionError,
  ResumeWithoutSuspensionError,
  ThreadNotFoundError,
  WorkflowAbortedError,
  WorkflowError,
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
} from '../types.js';
import { applyWrites, buildInitialState, type ChannelWrite } from './channels.js';
import { newId } from './ids.js';

/**
 * @internal — invocation parameters for a single run.
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
 * @internal — invocation parameters for a resume.
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
}

/**
 * @internal — workflow namespace used in checkpoint store keys. The
 * engine binds the namespace to the workflow `name` so a single store
 * can host checkpoints from multiple workflows without collision.
 */
export function namespaceFor(config: { readonly name: string }): string {
  return `workflow/${config.name}`;
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
  readonly staticBefore?: boolean;
  readonly staticAfter?: boolean;
}

interface RunInternalState<TState extends object> {
  state: TState;
  versions: Record<string, number>;
  /** Sentinel: nodes whose edges have already been evaluated. */
  readonly visitedNodes: Set<string>;
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
 * @internal — execute the engine's inner loop and yield workflow
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
  const durability = opts.durability ?? config.durability ?? 'sync';

  const initialState = buildInitialState<TState>({
    channels,
    ...(config.initialState !== undefined ? { initial: config.initialState } : {}),
    inputState: input,
  });

  const internal: RunInternalState<TState> = {
    state: initialState,
    versions: {},
    visitedNodes: new Set<string>(),
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
 * @internal — resume a previously suspended (or crashed / aborted /
 * failed) thread.
 */
export async function* resumeEngine<TState extends object>(
  opts: EngineResumeOptions<TState>,
): AsyncIterable<WorkflowEvent<TState>> {
  const { config, threadId, directive, streamMode, signal } = opts;
  const tracer = config.tracer;
  const channels = config.channels as Readonly<Record<string, Channel<unknown>>>;
  const namespace = namespaceFor(config);
  const durability = opts.durability ?? config.durability ?? 'sync';
  const mode = opts.mode ?? 'resume';
  const lock = opts.resumeLock;

  if (lock?.has(threadId)) {
    throw new ConcurrentResumeError(threadId);
  }
  lock?.add(threadId);

  try {
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
          // died mid-run — the checkpoint is a valid recovery point, not an
          // active lease. The store-level CAS protects the genuinely-live case.
          status === 'suspended' || status === 'running' || status === 'aborted';
    if (!resumable) {
      yield emitError<TState>(threadId, new ResumeWithoutSuspensionError(threadId, status));
      return;
    }
    const restored = restoreState<TState>(tuple.checkpoint, channels);
    const frontier = readFrontier(tuple.metadata);

    const internal: RunInternalState<TState> = {
      state: restored.state,
      versions: { ...restored.versions },
      visitedNodes: new Set<string>(),
      pendingDynamicTasks: [],
      lastCompletedNodes: [],
      // WF-4: advance the step counter on resume so the first post-resume
      // checkpoint is strictly newer than the suspended one. Without this they
      // tie, and `getTuple` (max stepNumber) returns the STALE suspended
      // checkpoint — re-running the pause node after a crash, and livelocking a
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
      internal.pendingDynamicTasks = stepTasks
        .filter((t) => t.status !== 'completed')
        .map((t) => ({
          taskId: newId('task'),
          nodeName: t.nodeName,
          source: 'dispatch' as const,
          ...(t.dispatchArgs !== undefined ? { dispatchArgs: t.dispatchArgs } : {}),
        }));
    } else {
      // Suspended or crash ('running') resume: restore the persisted
      // frontier — completed-but-unwalked nodes and surviving dynamic
      // tasks (WF-1) — then fan the pause records back out.
      internal.lastCompletedNodes = [...frontier.completed];
      internal.pendingDynamicTasks = frontier.dynamic.map((d) => ({
        taskId: newId('task'),
        nodeName: d.nodeName,
        source: 'dispatch' as const,
        ...(d.dispatchArgs !== undefined ? { dispatchArgs: d.dispatchArgs } : {}),
      }));

      if (directive?.goto) {
        internal.pendingDynamicTasks = [
          {
            taskId: newId('task'),
            nodeName: directive.goto,
            source: 'dispatch',
          },
        ];
        internal.lastCompletedNodes = [];
      } else {
        const [primary, ...others] = frontier.pauses;
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
              // directive value. A static-before gate replays NOTHING — the
              // operator approved the node to run, not any inner pause().
              resumeValues: primary.staticBefore
                ? []
                : [...(primary.satisfied ?? []), directive?.resume],
              ...(primary.staticBefore ? { staticBefore: true } : {}),
            });
          }
        }
        for (const record of others) {
          // Parallel pausers beyond the first re-run with only their
          // already-satisfied values — they re-suspend rather than get lost.
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
      throw new WorkflowAbortedError(threadId, signalAbortReason(signal));
    }
    if (internal.stepNumber >= maxSteps) {
      throw new WorkflowError(
        'invalid-config',
        `workflow "${config.name}" exceeded the maxSteps cap (${maxSteps}); aborting to prevent runaway execution`,
        { hint: 'increase maxSteps on createWorkflow({...}) or check for an infinite edge cycle' },
      );
    }

    const { tasks, suspendBefore, deadEnd } = planTasks(config, internal);

    if (deadEnd) {
      // WF-14: no fired edges, no END edge, no dynamic tasks — the graph is
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
        frontier: frontierFromInternal(internal),
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

    const stepEvents: WorkflowEvent<TState>[] = [];
    const customEvents: WorkflowEvent<TState>[] = [];

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
    // snapshot — in-place mutation throws instead of corrupting siblings
    // or the persisted state.
    const stateView = deepFreeze(structuredClone(internal.state)) as TState;

    const taskPromises = tasks.map(async (task) => {
      if (includeTaskEvents) {
        stepEvents.push({
          type: 'workflow.task.start',
          stepNumber: internal.stepNumber,
          taskId: task.taskId,
          nodeName: task.nodeName,
        });
      }
      const start = Date.now();
      const ctxEmit = (name: string, payload?: unknown): void => {
        customEvents.push({
          type: 'workflow.custom',
          name,
          payload,
        });
      };

      const ctx: WorkflowContext<TState> = Object.freeze({
        threadId,
        stepNumber: internal.stepNumber,
        taskId: task.taskId,
        signal: taskController.signal,
        emit: ctxEmit,
        state: stateView,
        ...(task.dispatchArgs !== undefined ? { dispatchArgs: task.dispatchArgs } : {}),
      });

      let writes: ChannelWrite[] = [];
      const dispatches: PlannedTask[] = [];
      let paused: { value: unknown } | undefined;
      let status: 'completed' | 'paused' | 'failed' = 'completed';
      try {
        let nodeOutput: unknown;
        const node = config.nodes[task.nodeName];
        if (!node) {
          throw new NodeExecutionError(task.nodeName, new Error('node not registered'));
        }
        if (task.source === 'resume') {
          nodeOutput = await runResumedNode(node, ctx, task.resumeValues ?? []);
        } else {
          nodeOutput = await Promise.resolve(node.run(ctx.state, ctx));
        }

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
      }
    });

    try {
      await waitForTasksOrTimeout(taskPromises, taskController.signal, cancelGraceMs);
    } finally {
      signal?.removeEventListener('abort', onSignalAbort);
    }

    for (const ev of stepEvents) yield ev;
    if (includeCustomEvents) for (const ev of customEvents) yield ev;

    if (signal?.aborted && !nodeFailure) {
      nodeFailure = {
        nodeName: tasks[0]?.nodeName ?? '<unknown>',
        cause: new WorkflowAbortedError(threadId, signalAbortReason(signal)),
      };
    }

    if (nodeFailure) {
      const successWrites: ChannelWrite[] = [];
      for (const outcome of taskOutcomes) {
        if (outcome.status === 'completed') {
          for (const w of outcome.writes) successWrites.push(w);
        }
      }
      // WF-3: an abort where every task still completed cleanly is a
      // boundary stop — persist 'aborted' (resumable), not 'failed'. A
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
          pauses: [],
          dynamic: [],
          completed: [],
          // The full task list of the failed step — `retry` replays the
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

    // WF-1/WF-2: collect EVERY pause raised this step — parallel pausers
    // beyond the first re-suspend on resume instead of getting lost.
    const pauseRecords: PendingPauseRecord[] = [];
    for (const outcome of taskOutcomes) {
      if (outcome.paused === undefined) continue;
      pauseRecords.push({
        nodeName: outcome.task.nodeName,
        value: outcome.paused.value,
        ...(outcome.task.dispatchArgs !== undefined
          ? { dispatchArgs: outcome.task.dispatchArgs }
          : {}),
        ...(outcome.task.resumeValues !== undefined && outcome.task.resumeValues.length > 0
          ? { satisfied: outcome.task.resumeValues }
          : {}),
      });
    }

    const allWrites: ChannelWrite[] = [];
    const newDynamicTasks: PlannedTask[] = [];
    for (const outcome of taskOutcomes) {
      if (outcome.status !== 'completed') continue;
      for (const w of outcome.writes) allWrites.push(w);
      for (const t of outcome.pendingDispatches) newDynamicTasks.push(t);
    }

    const applied = applyWrites<TState>({
      state: internal.state,
      versions: internal.versions,
      channels,
      writes: allWrites,
    });

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
        } satisfies WorkflowEvent<TState>;
      }
    }

    internal.lastCompletedNodes = taskOutcomes
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
        frontier: frontierFromInternal(internal),
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
    // persisted BEFORE `workflow.step.end` is reported — an abandoned
    // iterator / killed process can always recover the completed step.
    const checkpointId = await persistCheckpoint({
      config,
      namespace,
      threadId,
      internal,
      durability,
      status: 'running',
      frontier: frontierFromInternal(internal),
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
    // WF-8: under `durability: 'exit'` the running put is skipped — the
    // parent pointer must keep referencing the last checkpoint that
    // actually exists in the store.
    if (checkpointId !== null) {
      internal.parentCheckpointId = checkpointId;
    }
    internal.stepNumber += 1;

    if (signal?.aborted) {
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

  if (planned.length === 0 && fromCompleted.includes(START_NODE) === false) {
    if (reachableEnd(config, fromCompleted, internal.state)) {
      return { tasks: [] };
    }
    // WF-14: nothing fired and no END edge is satisfied — a dead end.
    return { tasks: [], deadEnd: [...fromCompleted] };
  }

  return { tasks: planned };
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
  // WF-14: completion must be EARNED by a satisfied END edge — the old
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
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { nodeName?: unknown }).nodeName === 'string' &&
    'args' in value
  );
}

async function runResumedNode<TState extends object>(
  node: WorkflowNode<TState>,
  ctx: WorkflowContext<TState>,
  resumeValues: ReadonlyArray<unknown>,
): Promise<unknown> {
  return runWithPauseResume(resumeValues, async () => node.run(ctx.state, ctx));
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
 * the configured durability mode skipped the put (WF-8) — callers must
 * not report or parent-link a checkpoint that does not exist.
 *
 * WF-12: before writing, the latest stored checkpoint is compared
 * against the run's parent pointer — if another writer advanced the
 * thread in between, a `checkpoint-version-conflict` error is thrown
 * instead of forking the timeline.
 */
async function persistCheckpoint<TState extends object>(
  args: PersistCheckpointArgs<TState>,
): Promise<string | null> {
  const { config, namespace, threadId, internal, durability, status, nodeName } = args;
  const checkpointId = newId('cp');
  const now = new Date().toISOString();
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
  const metadata: CheckpointMetadata = {
    source: durability,
    status,
    ...(nodeName !== undefined ? { nodeName } : {}),
    ...(tags !== undefined ? { tags } : {}),
  };

  if (!skipPut) {
    await config.checkpointStore.put(threadId, namespace, checkpoint, metadata);
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

const PAUSE_TAG_PREFIX = 'pause:' as const;
const FRONTIER_TAG_PREFIX = 'frontier:' as const;

/**
 * The resumable frontier persisted with every checkpoint (WF-1/2/3):
 * everything the engine had in flight at persist time.
 */
interface FrontierEnvelope {
  readonly v: 1;
  /** Every pause raised by the suspension — parallel pausers included. */
  readonly pauses: ReadonlyArray<PendingPauseRecord>;
  /** Dispatch-scheduled tasks that have not run yet. */
  readonly dynamic: ReadonlyArray<{ readonly nodeName: string; readonly dispatchArgs?: unknown }>;
  /** Nodes that completed but whose outgoing edges were not walked yet. */
  readonly completed: ReadonlyArray<string>;
  /** Task list of a failed step — drives `retry` replay (WF-3/WF-6). */
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
): FrontierEnvelope {
  return {
    v: 1,
    pauses: [...internal.pendingPauses],
    dynamic: internal.pendingDynamicTasks.map((t) => ({
      nodeName: t.nodeName,
      ...(t.dispatchArgs !== undefined ? { dispatchArgs: t.dispatchArgs } : {}),
    })),
    completed: [...internal.lastCompletedNodes],
  };
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

function readFrontier(metadata: CheckpointMetadata): FrontierEnvelope {
  const frontierTag = metadata.tags?.find((t) => t.startsWith(FRONTIER_TAG_PREFIX));
  if (frontierTag) {
    try {
      const parsed = JSON.parse(
        frontierTag.slice(FRONTIER_TAG_PREFIX.length),
      ) as Partial<FrontierEnvelope>;
      return {
        v: 1,
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
 * @internal — restore a `Workflow.fork` clone. Copies the source
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
  const newCheckpoint: Checkpoint = {
    ...tuple.checkpoint,
    id: newId('cp'),
    threadId: newThreadId,
    namespace,
    ...(tuple.checkpoint.parentId === undefined ? {} : { parentId: tuple.checkpoint.parentId }),
  };
  await input.config.checkpointStore.put(newThreadId, namespace, newCheckpoint, {
    source: 'sync',
    status: tuple.metadata.status,
    ...(tuple.metadata.nodeName !== undefined ? { nodeName: tuple.metadata.nodeName } : {}),
    ...(tuple.metadata.tags !== undefined ? { tags: [...tuple.metadata.tags] } : {}),
  });
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
  return {
    schema: CHECKPOINT_SCHEMA_VERSION,
    state: structuredClone(state),
  };
}

export function unwrapPersistedState(raw: unknown): unknown {
  // Versioned envelope. Older alpha/dev checkpoints written before the
  // envelope existed unwrap as the raw object — we accept either shape
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
): Promise<void> {
  const settled = Promise.allSettled(tasks).then(() => undefined);
  if (signal.aborted) {
    return Promise.race([settled, deadline(cancelGraceMs)]);
  }
  let timeoutId: NodeJS.Timeout | undefined;
  const onAbortDeadline = new Promise<void>((resolve) => {
    const trigger = (): void => {
      timeoutId = setTimeout(() => resolve(), cancelGraceMs);
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
