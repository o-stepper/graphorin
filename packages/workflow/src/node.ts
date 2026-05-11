/**
 * `createNode({...})` — minimal factory wrapper for declaring a
 * workflow node. Returns a {@link WorkflowNode} carrying the
 * supplied `name` + `run(...)` callback.
 *
 * @packageDocumentation
 */

import type { NodeRunResult, WorkflowNode, WorkflowNodeRun } from './types.js';

/**
 * Construct a {@link WorkflowNode}. The wrapper exists to give the
 * engine a stable shape and to keep `createWorkflow({...})` callers
 * from instantiating nodes by hand.
 *
 * @stable
 */
export function createNode<TState extends object = Record<string, unknown>>(opts: {
  readonly name: string;
  readonly run: WorkflowNodeRun<TState>;
}): WorkflowNode<TState> {
  return Object.freeze({ name: opts.name, run: opts.run });
}

export type { NodeRunResult, WorkflowNode, WorkflowNodeRun };
