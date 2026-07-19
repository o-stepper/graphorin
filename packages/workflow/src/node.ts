/**
 * `createNode({...})` - minimal factory wrapper for declaring a
 * workflow node. Returns a {@link WorkflowNode} carrying the
 * supplied `name` + `run(...)` callback.
 *
 * @packageDocumentation
 */

import type {
  NodeRunResult,
  WorkflowNode,
  WorkflowNodeRetryPolicy,
  WorkflowNodeRun,
} from './types.js';

/**
 * Construct a {@link WorkflowNode}. The wrapper exists to give the
 * engine a stable shape and to keep `createWorkflow({...})` callers
 * from instantiating nodes by hand. Carries the optional per-node
 * execution policy: `timeoutMs` + `retry`.
 *
 * @stable
 */
export function createNode<TState extends object = Record<string, unknown>>(opts: {
  readonly name: string;
  readonly run: WorkflowNodeRun<TState>;
  readonly timeoutMs?: number;
  readonly retry?: WorkflowNodeRetryPolicy;
}): WorkflowNode<TState> {
  return Object.freeze({
    name: opts.name,
    run: opts.run,
    ...(opts.timeoutMs !== undefined ? { timeoutMs: opts.timeoutMs } : {}),
    ...(opts.retry !== undefined ? { retry: opts.retry } : {}),
  });
}

export type { NodeRunResult, WorkflowNode, WorkflowNodeRun };
