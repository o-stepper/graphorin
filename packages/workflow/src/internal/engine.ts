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
  ConcurrentResumeError,
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
  readonly resumeValue?: unknown;
  readonly staticBefore?: boolean;
  readonly staticAfter?: boolean;
  readonly pendingPause?: PendingPauseRecord;
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
  pendingPause: PendingPauseRecord | undefined;
  status: 'running' | 'suspended' | 'completed' | 'failed' | 'aborted';
  closed: boolean;
}

const ACTIVE_RESUMES = new Map<string, Promise<void>>();

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
    pendingPause: undefined,
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
 * @internal — resume a previously suspended thread.
 */
export async function* resumeEngine<TState extends object>(
  opts: EngineResumeOptions<TState>,
): AsyncIterable<WorkflowEvent<TState>> {
  const { config, threadId, directive, streamMode, signal } = opts;
  const tracer = config.tracer;
  const channels = config.channels as Readonly<Record<string, Channel<unknown>>>;
  const namespace = namespaceFor(config);
  const durability = opts.durability ?? config.durability ?? 'sync';

  if (ACTIVE_RESUMES.has(threadId)) {
    throw new ConcurrentResumeError(threadId);
  }
  const ticket = (async (): Promise<void> => {})();
  ACTIVE_RESUMES.set(threadId, ticket);

  try {
    const tuple = await config.checkpointStore.getTuple(threadId, namespace);
    if (!tuple) {
      yield emitError<TState>(threadId, new ThreadNotFoundError(threadId));
      return;
    }
    const status = tuple.metadata.status;
    if (status !== 'suspended') {
      yield emitError<TState>(threadId, new ResumeWithoutSuspensionError(threadId, status));
      return;
    }
    const restored = restoreState<TState>(tuple.checkpoint, channels);
    const pendingPause = readPendingPause(tuple.metadata);

    const internal: RunInternalState<TState> = {
      state: restored.state,
      versions: { ...restored.versions },
      visitedNodes: new Set<string>(),
      pendingDynamicTasks: [],
      lastCompletedNodes: [],
      stepNumber: tuple.checkpoint.stepNumber,
      parentCheckpointId: tuple.checkpoint.id,
      pendingPause: pendingPause,
      status: 'running',
      closed: false,
    };

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

    if (directive?.goto) {
      internal.pendingDynamicTasks = [
        {
          taskId: newId('task'),
          nodeName: directive.goto,
          source: 'dispatch',
        },
      ];
      internal.pendingPause = undefined;
    } else if (pendingPause) {
      if (pendingPause.staticAfter) {
        // The paused node already completed; resume by walking its
        // outgoing edges instead of re-running the body.
        internal.lastCompletedNodes = [pendingPause.nodeName];
      } else {
        internal.pendingDynamicTasks = [
          {
            taskId: newId('task'),
            nodeName: pendingPause.nodeName,
            source: 'resume',
            ...(pendingPause.dispatchArgs !== undefined
              ? { dispatchArgs: pendingPause.dispatchArgs }
              : {}),
            resumeValue: directive?.resume,
            ...(pendingPause.staticBefore ? { staticBefore: true } : {}),
          },
        ];
      }
      internal.pendingPause = undefined;
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
    ACTIVE_RESUMES.delete(threadId);
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

    const { tasks, suspendBefore } = planTasks(config, internal);

    if (suspendBefore) {
      const pause: PendingPauseRecord = {
        nodeName: suspendBefore,
        value: { kind: 'static-before', node: suspendBefore },
        staticBefore: true,
      };
      internal.pendingPause = pause;
      internal.status = 'suspended';
      const checkpointId = await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: 'suspended',
        nodeName: suspendBefore,
        pendingPause: pause,
      });
      if (includeCheckpointEvents) {
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
      if (includeCheckpointEvents) {
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

    let pauseRecord: PendingPauseRecord | undefined;
    let nodeFailure: { nodeName: string; cause: unknown } | undefined;
    const taskOutcomes: Array<{
      task: PlannedTask;
      writes: ChannelWrite[];
      paused?: { value: unknown };
      durationMs: number;
      status: 'completed' | 'paused' | 'failed';
      pendingDispatches: PlannedTask[];
    }> = [];

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
        state: internal.state,
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
          nodeOutput = await runResumedNode(node, ctx, task.resumeValue);
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
      const checkpointId = await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: 'failed',
        nodeName: nodeFailure.nodeName,
        pendingWritesByTask: groupWritesByTask(successWrites),
      });
      stepSpan?.recordException(nodeFailure.cause);
      stepSpan?.setStatus('error');
      stepSpan?.end();
      if (includeCheckpointEvents) {
        yield checkpointEvent<TState>(checkpointId, internal.stepNumber);
      }
      internal.status = 'failed';
      throw wrapNodeFailure(nodeFailure.nodeName, nodeFailure.cause);
    }

    const pausedTasks = taskOutcomes.filter((t) => t.paused !== undefined);
    if (pausedTasks.length > 0) {
      const first = pausedTasks[0];
      if (first?.paused) {
        pauseRecord = {
          nodeName: first.task.nodeName,
          value: first.paused.value,
          ...(first.task.dispatchArgs !== undefined
            ? { dispatchArgs: first.task.dispatchArgs }
            : {}),
        };
      }
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
        if (includeCheckpointEvents) {
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

    if (includeStepEvents) {
      yield {
        type: 'workflow.step.end',
        stepNumber: internal.stepNumber,
        state: internal.state,
      } satisfies WorkflowEvent<TState>;
    }

    let staticAfterPause: PendingPauseRecord | undefined;
    if (!pauseRecord) {
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

    const finalPause = pauseRecord ?? staticAfterPause;
    if (finalPause) {
      internal.pendingPause = finalPause;
      internal.status = 'suspended';
      const checkpointId = await persistCheckpoint({
        config,
        namespace,
        threadId,
        internal,
        durability,
        status: 'suspended',
        nodeName: finalPause.nodeName,
        pendingPause: finalPause,
      });
      stepSpan?.setStatus('ok');
      stepSpan?.end();
      if (includeCheckpointEvents) {
        yield checkpointEvent<TState>(checkpointId, internal.stepNumber);
      }
      yield {
        type: 'workflow.suspended',
        threadId,
        stepNumber: internal.stepNumber,
        state: internal.state,
        value: finalPause.value,
      } satisfies WorkflowEvent<TState>;
      internal.closed = true;
      return;
    }

    const checkpointId = await persistCheckpoint({
      config,
      namespace,
      threadId,
      internal,
      durability,
      status: 'running',
    });
    stepSpan?.setStatus('ok');
    stepSpan?.end();
    if (includeCheckpointEvents) {
      yield checkpointEvent<TState>(checkpointId, internal.stepNumber);
    }
    internal.parentCheckpointId = checkpointId;
    internal.stepNumber += 1;

    if (signal?.aborted) {
      throw new WorkflowAbortedError(threadId, signalAbortReason(signal));
    }
  }
}

function planTasks<TState extends object>(
  config: WorkflowConfig<TState>,
  internal: RunInternalState<TState>,
): { readonly tasks: PlannedTask[]; readonly suspendBefore?: string } {
  const planned: PlannedTask[] = [];
  for (const task of internal.pendingDynamicTasks) planned.push(task);

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
      return { tasks: [], suspendBefore: task.nodeName };
    }
  }

  if (
    planned.length === 0 &&
    fromCompleted.includes(START_NODE) === false &&
    reachableEnd(config, fromCompleted, internal.state)
  ) {
    return { tasks: [] };
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
  return true;
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
  resumeValue: unknown,
): Promise<unknown> {
  return runWithPauseResume(resumeValue, async () => node.run(ctx.state, ctx));
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

interface PersistCheckpointArgs<TState extends object> {
  readonly config: WorkflowConfig<TState>;
  readonly namespace: string;
  readonly threadId: string;
  readonly internal: RunInternalState<TState>;
  readonly durability: DurabilityMode;
  readonly status: CheckpointMetadata['status'];
  readonly nodeName?: string;
  readonly pendingPause?: PendingPauseRecord;
  readonly pendingWritesByTask?: Map<string, ChannelWrite[]>;
}

async function persistCheckpoint<TState extends object>(
  args: PersistCheckpointArgs<TState>,
): Promise<string> {
  const { config, namespace, threadId, internal, durability, status, nodeName, pendingPause } =
    args;
  const checkpointId = newId('cp');
  const now = new Date().toISOString();
  const tags = pendingPause ? encodePendingPause(pendingPause) : undefined;

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

  if (durability === 'sync') {
    await config.checkpointStore.put(threadId, namespace, checkpoint, metadata);
  } else if (durability === 'async') {
    await config.checkpointStore.put(threadId, namespace, checkpoint, metadata);
  } else {
    if (status !== 'running') {
      await config.checkpointStore.put(threadId, namespace, checkpoint, metadata);
    }
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

  return checkpointId;
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

function encodePendingPause(pause: PendingPauseRecord): string[] {
  return [
    `${PAUSE_TAG_PREFIX}${JSON.stringify({
      nodeName: pause.nodeName,
      value: pause.value,
      ...(pause.dispatchArgs !== undefined ? { dispatchArgs: pause.dispatchArgs } : {}),
      ...(pause.staticBefore ? { staticBefore: true } : {}),
      ...(pause.staticAfter ? { staticAfter: true } : {}),
    })}`,
  ];
}

function readPendingPause(metadata: CheckpointMetadata): PendingPauseRecord | undefined {
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
