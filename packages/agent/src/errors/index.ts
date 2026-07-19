/**
 * Typed error surface for `@graphorin/agent`.
 *
 * Every error class extends the base {@link AgentRuntimeError} which is
 * a thin wrapper around `Error` with a stable `code` discriminator so
 * callers can `switch` on it without parsing messages.
 *
 * @packageDocumentation
 */

/**
 * Stable code discriminator surfaced on every {@link AgentRuntimeError}.
 *
 * @stable
 */
export type AgentRuntimeErrorCode =
  | 'invalid-config'
  | 'invalid-preferred-model'
  | 'invalid-fallback-policy'
  | 'invalid-evaluator-optimizer-config'
  | 'agent-resolution-failed'
  | 'tool-not-found'
  | 'handoff-target-not-found'
  | 'multiple-handoffs-in-step'
  | 'sub-run-resume-target-not-found'
  | 'run-aborted'
  | 'middleware-order-violation'
  | 'progress-write-failed'
  | 'merge-blocked'
  | 'protocol-injection-rejected'
  | 'run-state-version-unsupported'
  | 'run-state-malformed'
  | 'concurrent-run'
  | 'budget-exceeded'
  | 'budget-unpriced';

/**
 * Base class for every error thrown from `@graphorin/agent`.
 *
 * @stable
 */
export class AgentRuntimeError extends Error {
  readonly code: AgentRuntimeErrorCode;
  constructor(code: AgentRuntimeErrorCode, message: string, name = 'AgentRuntimeError') {
    super(message);
    this.name = name;
    this.code = code;
  }
}

/**
 * Thrown by `createAgent({...})` when the supplied options fail
 * structural validation (missing `provider`, empty `name`, an
 * `outputType` of kind `'text'` carrying a `schema`, ...).
 *
 * @stable
 */
export class InvalidAgentConfigError extends AgentRuntimeError {
  constructor(reason: string) {
    super(
      'invalid-config',
      `Invalid createAgent({...}) options: ${reason}.`,
      'InvalidAgentConfigError',
    );
  }
}

/**
 * Thrown by `createAgent({...})` when `preferredModel` carries an
 * unknown literal (any value outside the `'fast' | 'balanced' |
 * 'smart'` cost-tier vocabulary AND not a valid `ModelSpec`).
 *
 * @stable
 */
export class InvalidPreferredModelError extends AgentRuntimeError {
  readonly value: unknown;
  constructor(value: unknown) {
    super(
      'invalid-preferred-model',
      `Invalid Agent.preferredModel: ${JSON.stringify(value)}. ` +
        "Expected 'fast' | 'balanced' | 'smart' | ModelSpec.",
      'InvalidPreferredModelError',
    );
    this.value = value;
  }
}

/**
 * Thrown by `evaluatorOptimizer({...})` when `maxIterations < 1` at
 * construction time. The helper purposely surfaces the misuse early
 * rather than failing on the first run.
 *
 * @stable
 */
export class EvaluatorOptimizerConfigError extends AgentRuntimeError {
  constructor(reason: string) {
    super(
      'invalid-evaluator-optimizer-config',
      `Invalid evaluatorOptimizer({...}) options: ${reason}.`,
      'EvaluatorOptimizerConfigError',
    );
  }
}

/**
 * Thrown by `runStateFromJSON(...)` when the agent name in the
 * serialized state cannot be resolved against the supplied agent
 * graph (renamed agent / removed handoff).
 *
 * @stable
 */
export class AgentResolutionError extends AgentRuntimeError {
  readonly agentId: string;
  constructor(agentId: string) {
    super(
      'agent-resolution-failed',
      `runStateFromJSON: agent '${agentId}' is not registered in the supplied graph.`,
      'AgentResolutionError',
    );
    this.agentId = agentId;
  }
}

/**
 * Thrown by the agent loop when the model emits a tool call referring
 * to an unregistered tool (the model hallucinated a name).
 *
 * @stable
 */
export class ToolNotFoundError extends AgentRuntimeError {
  readonly toolName: string;
  constructor(toolName: string) {
    super(
      'tool-not-found',
      `Tool '${toolName}' is not registered on this agent.`,
      'ToolNotFoundError',
    );
    this.toolName = toolName;
  }
}

/**
 * Thrown when the model invokes more than one handoff (`transfer_to_*`)
 * tool in a single response. Per the agent-loop documentation this is
 * an error rather than a silent drop.
 *
 * @stable
 */
/**
 * Thrown when a second `run()` / `stream()` starts while another run is
 * in flight on the same `Agent` instance. The public surface
 * (`steer` / `followUp` / `abort` / `compact`) addresses "the run"
 * without a run handle, so overlapping runs would share the abort
 * controller, steer queue, and executor bridge - start the second run
 * on its own `createAgent(...)` instance instead.
 *
 * @stable
 */
export class ConcurrentRunError extends AgentRuntimeError {
  constructor() {
    super(
      'concurrent-run',
      'This Agent instance already has a run in flight. One run per instance: await the active run (or abort it), or create a separate agent instance for parallel work.',
      'ConcurrentRunError',
    );
  }
}

export class MultipleHandoffsInStepError extends AgentRuntimeError {
  readonly handoffNames: ReadonlyArray<string>;
  constructor(handoffNames: ReadonlyArray<string>) {
    super(
      'multiple-handoffs-in-step',
      `The model invoked multiple handoff tools in one step: ${handoffNames.join(', ')}.`,
      'MultipleHandoffsInStepError',
    );
    this.handoffNames = handoffNames;
  }
}

/**
 * Thrown when a resume directive routes a decision into a parked
 * sub-agent run but the resuming agent instance cannot resolve
 * the target: the parked toolName matches neither a configured handoff
 * target nor a `toTool` sub-agent tool. Resume a parked sub-run on the
 * SAME parent instance (or an identically-configured one).
 *
 * @stable
 */
export class SubAgentResumeTargetNotFoundError extends AgentRuntimeError {
  readonly toolName: string;
  constructor(toolName: string, detail: string) {
    super(
      'sub-run-resume-target-not-found',
      `Cannot resume parked sub-agent run for tool '${toolName}': ${detail}. Parked sub-runs resume only on a parent instance configured with the same handoff target or toTool sub-agent tool.`,
      'SubAgentResumeTargetNotFoundError',
    );
    this.toolName = toolName;
  }
}

/**
 * Thrown by `runStateFromJSON(...)` when the version field in the
 * serialized state is from a future major version of the framework.
 *
 * @stable
 */
export class RunStateVersionUnsupportedError extends AgentRuntimeError {
  readonly version: string;
  readonly readerVersion: string;
  constructor(version: string, readerVersion: string) {
    super(
      'run-state-version-unsupported',
      `RunState version '${version}' is newer than reader '${readerVersion}'. ` +
        'Upgrade @graphorin/agent to load this state.',
      'RunStateVersionUnsupportedError',
    );
    this.version = version;
    this.readerVersion = readerVersion;
  }
}

/**
 * Thrown by `runStateFromJSON(...)` when the supplied JSON does not
 * shape-match the documented `SerializedRunState`.
 *
 * @stable
 */
export class RunStateMalformedError extends AgentRuntimeError {
  constructor(reason: string) {
    super('run-state-malformed', `Malformed RunState JSON: ${reason}.`, 'RunStateMalformedError');
  }
}

/**
 * Thrown by `Agent.fanOut(...)` when the configured
 * `MergeAgentSidewaysInjectionGuard` fires with strictness
 * `'detect-and-block'`.
 *
 * @stable
 */
export class MergeBlockedError extends AgentRuntimeError {
  readonly fanOutId: string;
  readonly reason: string;
  constructor(fanOutId: string, reason: string) {
    super(
      'merge-blocked',
      `Agent.fanOut('${fanOutId}') merge blocked by MergeAgentSidewaysInjectionGuard: ${reason}.`,
      'MergeBlockedError',
    );
    this.fanOutId = fanOutId;
    this.reason = reason;
  }
}

/**
 * Thrown by the protocol-injection guard when the operator selected
 * the strictest deployment posture (`escapePolicy: 'reject'`) and a
 * tool result body carries control characters at the corresponding
 * outbound boundary.
 *
 * @stable
 */
export class ProtocolInjectionRejectError extends AgentRuntimeError {
  readonly boundary: string;
  readonly matchedPattern: string;
  constructor(boundary: string, matchedPattern: string) {
    super(
      'protocol-injection-rejected',
      `Protocol injection guard rejected output at the '${boundary}' boundary (matched ${matchedPattern}).`,
      'ProtocolInjectionRejectError',
    );
    this.boundary = boundary;
    this.matchedPattern = matchedPattern;
  }
}

/**
 * Thrown by `agent.progress.write(...)` when the atomic write fails
 * (disk full, permission denied, ...). The partial `.tmp` file is
 * unlinked before the error propagates.
 *
 * @stable
 */
export class ProgressWriteError extends AgentRuntimeError {
  readonly path: string;
  constructor(path: string, cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(
      'progress-write-failed',
      `agent.progress.write('${path}') failed: ${message}.`,
      'ProgressWriteError',
    );
    this.path = path;
    if (cause !== undefined) {
      // Preserve the underlying cause for diagnostics.
      Object.defineProperty(this, 'cause', {
        value: cause,
        enumerable: false,
        configurable: true,
        writable: true,
      });
    }
  }
}

/**
 * Thrown when a run crosses its `RunBudget` ceiling under
 * `onExceed: 'throw'`. The run's promise REJECTS with this error
 * after an `agent.error` event; graceful finalization is skipped. The
 * default `onExceed: 'stop'` never throws - it resolves the run as
 * `status: 'failed'` with `error.code: 'budget-exceeded'` instead.
 *
 * @stable
 */
export class AgentBudgetExceededError extends AgentRuntimeError {
  /** Which ceiling tripped. */
  readonly resource: 'cost' | 'tokens';
  /** Observed cumulative value at the between-step check. */
  readonly observed: number;
  /** The configured ceiling. */
  readonly limit: number;
  constructor(args: { resource: 'cost' | 'tokens'; observed: number; limit: number }) {
    const rendered =
      args.resource === 'cost'
        ? `$${args.observed.toFixed(4)} > $${args.limit.toFixed(4)} USD`
        : `${args.observed} > ${args.limit} tokens`;
    super(
      'budget-exceeded',
      `Run budget exceeded: ${rendered} (RunBudget.${args.resource === 'cost' ? 'maxCostUsd' : 'maxTokens'}).`,
      'AgentBudgetExceededError',
    );
    this.resource = args.resource;
    this.observed = args.observed;
    this.limit = args.limit;
  }
}

/**
 * `RunBudget.maxCostUsd` is set but the
 * accumulated usage carries no USD cost data, so the ceiling cannot
 * observe spend. Under the fail-closed default
 * (`RunBudget.onUnpriced: 'fail'`) the run stops at the first
 * between-step check: `onExceed: 'throw'` rejects with this error, the
 * `'stop'` shape fails the run with `error.code: 'budget-unpriced'`.
 * Wire `withCostTracking` (@graphorin/provider) with a
 * `@graphorin/pricing` snapshot, use `RunBudget.maxTokens`, or opt back
 * into the old warn-once behaviour with `onUnpriced: 'warn'`.
 *
 * @stable
 */
export class AgentBudgetUnpricedError extends AgentRuntimeError {
  constructor() {
    super(
      'budget-unpriced',
      'RunBudget.maxCostUsd is set but the accumulated usage carries no USD cost data - ' +
        'the cost ceiling cannot observe spend. Wire withCostTracking (@graphorin/provider) ' +
        "with a @graphorin/pricing snapshot, use RunBudget.maxTokens, or set RunBudget.onUnpriced: 'warn' " +
        'to accept an unenforced ceiling.',
      'AgentBudgetUnpricedError',
    );
  }
}

/**
 * Thrown by `createAgent({...})` when the supplied
 * `composeProviderMiddleware` chain violates the canonical inside-out
 * ordering (DEC-145 / ADR-039).
 *
 * @stable
 */
export class ProviderMiddlewareOrderError extends AgentRuntimeError {
  constructor(reason: string) {
    super(
      'middleware-order-violation',
      `Provider middleware composition violated the inside-out ordering: ${reason}.`,
      'ProviderMiddlewareOrderError',
    );
  }
}
