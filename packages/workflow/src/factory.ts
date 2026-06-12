/**
 * `createWorkflow({...})` — the public entry point for the workflow
 * runtime. Validates the supplied configuration and returns the
 * {@link Workflow} handle that exposes `execute / resume / getState /
 * listCheckpoints / fork`.
 *
 * @packageDocumentation
 */

import type { Checkpoint, CheckpointId, Directive, WorkflowEvent } from '@graphorin/core';

import {
  CheckpointNotFoundError,
  InvalidWorkflowConfigError,
  ThreadNotFoundError,
  UnknownNodeError,
} from './errors/index.js';
import {
  forkThread,
  namespaceFor,
  resumeEngine,
  runEngine,
  unwrapPersistedState as unwrapPersistedStateForRead,
} from './internal/engine.js';
import { newId } from './internal/ids.js';
import {
  END_NODE,
  START_NODE,
  type StreamMode,
  TASKS_CHANNEL,
  type Workflow,
  type WorkflowConfig,
  type WorkflowExecuteOptions,
  type WorkflowResumeOptions,
  type WorkflowState,
} from './types.js';

const DEFAULT_STREAM_MODE: StreamMode = 'values';

/**
 * Build a {@link Workflow} from the supplied configuration. The
 * factory performs eager validation so misuse is caught at build time
 * rather than mid-execution.
 *
 * @stable
 */
export function createWorkflow<
  TState extends object = Record<string, unknown>,
  TInput extends Partial<TState> = Partial<TState>,
>(config: WorkflowConfig<TState>): Workflow<TState, TInput> {
  validateConfig(config);

  const nodeNames = Object.freeze(Object.keys(config.nodes));
  const namespace = namespaceFor(config);
  // Per-instance re-entrancy guard for resume/retry; cross-instance and
  // cross-process races are handled by the store-level checkpoint CAS.
  const resumeLock = new Set<string>();

  const workflow: Workflow<TState, TInput> = Object.freeze({
    name: config.name,
    nodeNames,
    execute(input: TInput, opts?: WorkflowExecuteOptions): AsyncIterable<WorkflowEvent<TState>> {
      const threadId = opts?.threadId ?? newId('thread');
      const streamMode = opts?.stream ?? DEFAULT_STREAM_MODE;
      return runEngine<TState, TInput>({
        config,
        threadId,
        input,
        streamMode,
        ...(opts?.signal !== undefined ? { signal: opts.signal } : {}),
        ...(opts?.durability !== undefined ? { durability: opts.durability } : {}),
      });
    },
    resume(
      threadId: string,
      directive?: Directive,
      opts?: WorkflowResumeOptions,
    ): AsyncIterable<WorkflowEvent<TState>> {
      const streamMode = opts?.stream ?? DEFAULT_STREAM_MODE;
      return resumeEngine<TState>({
        config,
        threadId,
        ...(directive !== undefined ? { directive } : {}),
        streamMode,
        ...(opts?.signal !== undefined ? { signal: opts.signal } : {}),
        resumeLock,
      });
    },
    retry(threadId: string, opts?: WorkflowResumeOptions): AsyncIterable<WorkflowEvent<TState>> {
      const streamMode = opts?.stream ?? DEFAULT_STREAM_MODE;
      return resumeEngine<TState>({
        config,
        threadId,
        streamMode,
        ...(opts?.signal !== undefined ? { signal: opts.signal } : {}),
        resumeLock,
        mode: 'retry',
      });
    },
    async getState(threadId: string): Promise<WorkflowState<TState>> {
      const tuple = await config.checkpointStore.getTuple(threadId, namespace);
      if (!tuple) throw new ThreadNotFoundError(threadId);
      const status =
        tuple.metadata.status === 'running' ||
        tuple.metadata.status === 'suspended' ||
        tuple.metadata.status === 'completed' ||
        tuple.metadata.status === 'failed' ||
        tuple.metadata.status === 'aborted'
          ? tuple.metadata.status
          : 'running';
      const unwrapped = unwrapPersistedStateForRead(tuple.checkpoint.state);
      const stateRecord = (unwrapped as TState) ?? ({} as TState);
      const pendingPause = readPauseTag(tuple.metadata.tags);
      return {
        threadId,
        stepNumber: tuple.checkpoint.stepNumber,
        status,
        state: { ...(stateRecord as object) } as TState,
        checkpointId: tuple.checkpoint.id,
        ...(pendingPause !== undefined ? { pendingPause } : {}),
      };
    },
    async listCheckpoints(threadId: string): Promise<ReadonlyArray<Checkpoint>> {
      const out: Checkpoint[] = [];
      for await (const tuple of config.checkpointStore.list(threadId, namespace)) {
        out.push(tuple.checkpoint);
      }
      return Object.freeze(out);
    },
    async fork(
      threadId: string,
      fromCheckpointId: CheckpointId,
    ): Promise<{ readonly newThreadId: string }> {
      const probe = await config.checkpointStore.getTuple(threadId, namespace, fromCheckpointId);
      if (!probe) throw new CheckpointNotFoundError(threadId, fromCheckpointId);
      return forkThread<TState>({
        config,
        threadId,
        fromCheckpointId,
      });
    },
  });

  return workflow;
}

function validateConfig<TState extends object>(config: WorkflowConfig<TState>): void {
  if (typeof config.name !== 'string' || config.name.length === 0) {
    throw new InvalidWorkflowConfigError('createWorkflow({ name }) must be a non-empty string');
  }
  if (typeof config.nodes !== 'object' || config.nodes === null) {
    throw new InvalidWorkflowConfigError(
      'createWorkflow({ nodes }) must be a record of name -> WorkflowNode',
    );
  }
  if (Object.keys(config.nodes).length === 0) {
    throw new InvalidWorkflowConfigError(
      'createWorkflow({ nodes }) must declare at least one node',
    );
  }
  for (const [name, node] of Object.entries(config.nodes)) {
    if (name === START_NODE || name === END_NODE) {
      throw new InvalidWorkflowConfigError(
        `node name "${name}" is reserved for the implicit ${name} sentinel`,
      );
    }
    if (typeof node?.run !== 'function') {
      throw new InvalidWorkflowConfigError(
        `node "${name}" must expose a callable run(state, ctx) function`,
      );
    }
  }
  if (!Array.isArray(config.edges)) {
    throw new InvalidWorkflowConfigError('createWorkflow({ edges }) must be an array');
  }
  let hasStartEdge = false;
  for (const edge of config.edges) {
    if (typeof edge.from !== 'string' || typeof edge.to !== 'string') {
      throw new InvalidWorkflowConfigError('every edge must declare string `from` and `to` fields');
    }
    if (edge.from === START_NODE) hasStartEdge = true;
    if (edge.from !== START_NODE && !(edge.from in config.nodes)) {
      throw new UnknownNodeError(edge.from, `edge.from`);
    }
    if (edge.to !== END_NODE && !(edge.to in config.nodes)) {
      throw new UnknownNodeError(edge.to, `edge.to`);
    }
  }
  if (!hasStartEdge) {
    throw new InvalidWorkflowConfigError(
      `the edges list must contain at least one edge from "${START_NODE}" — workflows always start there`,
    );
  }
  if (typeof config.channels !== 'object' || config.channels === null) {
    throw new InvalidWorkflowConfigError(
      'createWorkflow({ channels }) must be a record of stateKey -> Channel descriptor',
    );
  }
  for (const channelName of Object.keys(config.channels)) {
    if (channelName === TASKS_CHANNEL) {
      throw new InvalidWorkflowConfigError(
        `channel name "${channelName}" is reserved for internal task scheduling`,
      );
    }
  }
  if (!config.checkpointStore) {
    throw new InvalidWorkflowConfigError(
      'createWorkflow({ checkpointStore }) is required — supply an InMemoryCheckpointStore for tests or a SqliteCheckpointStore for production',
    );
  }
  if (
    config.durability !== undefined &&
    config.durability !== 'sync' &&
    config.durability !== 'async' &&
    config.durability !== 'exit'
  ) {
    throw new InvalidWorkflowConfigError(
      `durability mode "${config.durability}" is invalid — accepted values are "sync" | "async" | "exit"`,
    );
  }
  if (
    config.maxSteps !== undefined &&
    (config.maxSteps < 1 || !Number.isInteger(config.maxSteps))
  ) {
    throw new InvalidWorkflowConfigError('maxSteps must be a positive integer');
  }
  if (
    config.cancelGraceMs !== undefined &&
    (config.cancelGraceMs < 0 || !Number.isFinite(config.cancelGraceMs))
  ) {
    throw new InvalidWorkflowConfigError('cancelGraceMs must be a non-negative finite number');
  }
}

function readPauseTag(
  tags: ReadonlyArray<string> | undefined,
): WorkflowState<object>['pendingPause'] {
  const tag = tags?.find((t) => t.startsWith('pause:'));
  if (!tag) return undefined;
  try {
    const parsed = JSON.parse(tag.slice('pause:'.length)) as {
      nodeName?: string;
      value?: unknown;
      dispatchArgs?: unknown;
      staticBefore?: boolean;
      staticAfter?: boolean;
    };
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
