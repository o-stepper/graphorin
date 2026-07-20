/**
 * Tool executor surface for `@graphorin/tools`.
 *
 * @packageDocumentation
 */

export {
  type ApprovalDecision,
  type ApprovalGate,
  createToolExecutor,
  type DataFlowGuard,
  type DataFlowInspectInput,
  type DataFlowRecordInput,
  type DataFlowVerdict,
  type ExecuteBatchOptions,
  type ExecutorEvent,
  type ExecutorOptions,
  type PermissionHook,
  type PermissionHookInput,
  type PermissionHookResult,
  type ToolArgumentPolicyFacts,
  type ToolArgumentPolicyGuard,
  type ToolExecutor,
  type ToolRepairHook,
} from './executor.js';
export {
  buildToolExecutionContext,
  type SecretResolverHook,
  type ToolContextOptions,
} from './tool-context.js';
export { ToolRateLimitError } from './tool-errors.js';
