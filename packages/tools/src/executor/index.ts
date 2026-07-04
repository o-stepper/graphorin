/**
 * Tool executor surface for `@graphorin/tools`.
 *
 * @packageDocumentation
 */

export {
  type ApprovalGate,
  createToolExecutor,
  type DataFlowGuard,
  type DataFlowInspectInput,
  type DataFlowRecordInput,
  type DataFlowVerdict,
  type ExecuteBatchOptions,
  type ExecutorOptions,
  type ToolArgumentPolicyGuard,
  type ToolExecutor,
} from './executor.js';
export {
  buildToolExecutionContext,
  type ToolContextOptions,
} from './tool-context.js';
export { ToolRateLimitError } from './tool-errors.js';
