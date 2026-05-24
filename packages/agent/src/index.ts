/**
 * `@graphorin/agent` — agent runtime for the Graphorin framework.
 *
 * The package owns:
 *
 * - The `createAgent({...})` factory that wires the typed
 *   `model -> tool calls -> model` loop, the streaming event
 *   surface, the steering / followUp queues, durable HITL
 *   approvals, multi-agent handoffs (`Agent.toTool`, the filter
 *   library, secrets isolation), the agent-level model fallback
 *   chain, the per-step compaction lifecycle, the per-tool
 *   preferred-model resolution, the structured progress-artifact
 *   APIs, and the lateral-leak defense layer.
 * - `RunState.toJSON / fromJSON` helpers for caller-managed
 *   durable HITL.
 * - The handoff filter library.
 * - The agent-step-level fan-out helpers (`runFanOut`,
 *   `evaluatorOptimizer`, the progress IO surface).
 * - Pure decision functions consulted by the loop
 *   (`isAgentFallbackEligible`, `resolvePreferredModel`).
 * - Lateral-leak primitives (`CausalityMonitor`,
 *   `MergeAgentSidewaysInjectionGuard` decision helpers,
 *   protocol-injection guard).
 *
 * The full documentation lives in the package `README.md`.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.3.0';

export {
  AgentResolutionError,
  AgentRuntimeError,
  type AgentRuntimeErrorCode,
  EvaluatorOptimizerConfigError,
  InvalidAgentConfigError,
  InvalidPreferredModelError,
  MergeBlockedError,
  MultipleHandoffsInStepError,
  ProgressWriteError,
  ProtocolInjectionRejectError,
  ProviderMiddlewareOrderError,
  RunStateMalformedError,
  RunStateVersionUnsupportedError,
  ToolNotFoundError,
} from './errors/index.js';
export {
  type EvaluatorCallable,
  type EvaluatorOptimizerOptions,
  type EvaluatorOptimizerOutcome,
  type EvaluatorOutcome,
  evaluatorOptimizer,
  type GeneratorCallable,
  type Rubric,
} from './evaluator-optimizer/index.js';
export { createAgent } from './factory.js';

export {
  type AgentFallbackEligibility,
  type AgentFallbackPolicy,
  type AgentFallbackReason,
  isAgentFallbackEligible,
} from './fallback/index.js';
export {
  type ChildResult,
  type FanOutOptions,
  type FanOutResult,
  type MergeStrategy,
  type PerChildBudget,
  runFanOut,
} from './fanout/index.js';
export {
  bySensitivity,
  compose,
  custom,
  type DescribedFilter,
  defaultHandoffFilter,
  FILTER_KIND_CUSTOM,
  filters,
  full,
  lastN,
  lastUser,
  stripReasoning,
  stripSensitiveOutputs,
  stripToolCalls,
  summary,
} from './filters/index.js';
export {
  CausalityMonitor,
  type CausalityMonitorCheck,
  type CausalityMonitorConfig,
  type CausalityMonitorStrictness,
  type ChildTrustInput,
  type ContentOriginKind,
  computeSourceTrust,
  DEFAULT_DENIAL_PATTERNS,
  DEFAULT_MAX_CHAIN_DEPTH,
  evaluateMerge,
  type GuardOutcome,
  guardOutboundContent,
  type MergeBiasDecision,
  type MergeGuardConfig,
  type ProtocolBoundary,
  type ProtocolEscapePolicy,
  type ProtocolGuardConfig,
  resolvePolicy,
  type TrustClass,
} from './lateral-leak/index.js';
export {
  type PreferredModelResolution,
  pickTopTierAcrossTools,
  type ResolvePreferredModelInput,
  resolvePreferredModel,
} from './preferred-model/index.js';
export {
  createProgressIO,
  type ProgressIO,
  type ProgressIOConfig,
  type ProgressReadOptions,
  type ProgressWriteOptions,
} from './progress/index.js';

export {
  addModelUsage,
  aggregateUsageFromByModel,
  completedToolCallsFromState,
  createInitialRunState,
  deserializeRunState,
  RUN_STATE_SCHEMA_MAJOR_SUPPORTED,
  RUN_STATE_SCHEMA_VERSION,
  runStateFromJSON,
  runStateToJSON,
  type SerializedRunState,
  type SerializeRunStateOptions,
  serializeRunState,
} from './run-state/index.js';
export type {
  AbortOptions,
  Agent,
  AgentCallOptions,
  AgentConfig,
  AgentInput,
  AgentToToolOptions,
  CompactionApiResult,
  CompactOptions,
  GuardrailVerdict,
  InputGuardrail,
  OutputGuardrail,
  OutputSpec,
  PostCompactionHook,
  PrepareStepHook,
  PrepareStepOverrides,
  ResumeDirective,
  SkillsRegistryLike,
} from './types.js';
