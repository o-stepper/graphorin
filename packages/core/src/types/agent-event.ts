import type { RunError, RunState, RunStatus, RunVerdicts } from './run.js';
import type { ContentChunk, ToolError } from './tool.js';
import type { Usage } from './usage.js';

/**
 * Discriminated union of every event produced by `Agent.stream(...)`.
 *
 * Each variant has a literal `type` field used as the discriminator. The
 * union is exhaustive: `assertNever(...)` catches missed variants at
 * compile time.
 *
 * Wire contract (two layers): the server delivers events inside an
 * envelope `{ eventId, subject, type, payload }` where `payload` is the
 * JSON-safe `WireAgentEvent` projection (`toWireAgentEvent`), NOT this
 * raw union - three variants (`file.generated`, `tool.execute.partial`,
 * `agent.end`) carry `Uint8Array`/`URL` payloads that plain
 * `JSON.stringify` would corrupt. `@graphorin/protocol` validates the
 * envelope and leaves `payload` opaque (`z.unknown()`); clients decode
 * with `fromWireAgentEvent`. Adding a variant here counts as a
 * wire-format change; track it through changesets.
 *
 * Correlation policy (W-049): events are consumed from a per-run
 * stream, so cross-run attribution is the ENVELOPE's job (`subject`
 * carries `agentId`/`runId`); an in-payload `runId` exists only on the
 * variants that historically carry one and is deliberately NOT
 * retrofitted onto the rest. Within one tool lifecycle the correlation
 * key is `toolCallId`; `toolName` is duplicated onto the
 * `tool.execute.*` variants purely for subscriber convenience.
 *
 * @stable
 */
export type AgentEvent<TOutput = string> =
  | AgentStartEvent
  | StepStartEvent
  | TextDeltaEvent
  | TextCompleteEvent
  | ReasoningDeltaEvent
  | ToolCallStartEvent
  | ToolCallDeltaEvent
  | ToolCallEndEvent
  | ToolExecuteStartEvent
  | ToolExecuteProgressEvent
  | ToolExecutePartialEvent
  | ToolExecuteEndEvent
  | ToolExecuteErrorEvent
  | ToolApprovalRequestedEvent
  | ToolApprovalGrantedEvent
  | ToolApprovalDeniedEvent
  | ContextCompactedEvent
  | HandoffEvent
  | AgentSteeredEvent
  | AgentFollowUpQueuedEvent
  | AgentCancellingEvent
  | AgentModelFellbackEvent
  | AgentFanOutSpawnedEvent
  | AgentFanOutMergedEvent
  | AgentEvaluatorIterationEvent
  | AgentEvaluatorConvergedEvent
  | AgentProgressWrittenEvent
  | AgentProgressReadEvent
  | AgentLateralLeakDetectedEvent
  | FileGeneratedEvent
  | SourceCitedEvent
  | StepEndEvent
  | GuardrailTrippedEvent
  | VerifierResultEvent
  | SubagentEvent
  | AgentEndEvent<TOutput>
  | AgentErrorEvent;

/**
 * W-036: a CHILD sub-agent's event forwarded into the parent stream,
 * wrapped so it never aliases the parent's own step/run events. Which
 * child events forward is governed by the `forwardEvents` policy on
 * the handoff entry / `AgentToToolOptions` (default `'lifecycle'`).
 *
 * @stable
 */
export interface SubagentEvent {
  readonly type: 'subagent.event';
  /** The PARENT-side toolCallId of the handoff / sub-agent call. */
  readonly toolCallId: string;
  /** The child agent's configured name. */
  readonly agentName: string;
  /** The child's event, verbatim. */
  readonly event: AgentEvent<unknown>;
}

/** @stable */
export interface AgentStartEvent {
  readonly type: 'agent.start';
  readonly runId: string;
  readonly agentId: string;
}

/** @stable */
export interface StepStartEvent {
  readonly type: 'step.start';
  readonly stepNumber: number;
}

/** @stable */
export interface TextDeltaEvent {
  readonly type: 'text.delta';
  readonly delta: string;
}

/** @stable */
export interface TextCompleteEvent {
  readonly type: 'text.complete';
  readonly text: string;
}

/** @stable */
export interface ReasoningDeltaEvent {
  readonly type: 'reasoning.delta';
  readonly delta: string;
}

/** @stable */
export interface ToolCallStartEvent {
  readonly type: 'tool.call.start';
  readonly toolCallId: string;
  readonly toolName: string;
  readonly args: unknown;
}

/** @stable */
export interface ToolCallDeltaEvent {
  readonly type: 'tool.call.delta';
  readonly toolCallId: string;
  readonly argsDelta: string;
}

/** @stable */
export interface ToolCallEndEvent {
  readonly type: 'tool.call.end';
  readonly toolCallId: string;
  readonly finalArgs: unknown;
}

/** @stable */
export interface ToolExecuteStartEvent {
  readonly type: 'tool.execute.start';
  readonly toolCallId: string;
  /**
   * Convenience duplicate of the executing tool's name (W-049).
   * Correlation within a tool lifecycle is by `toolCallId`; this field
   * spares direct subscribers a stateful join back to the
   * `tool.call.start` that carried the name. Optional for wire
   * compatibility; the agent runtime always fills it.
   */
  readonly toolName?: string;
}

/**
 * Emitted by streaming-hint tools via `ctx.reportProgress(...)`. Counter
 * pair `(current, total?)` is consumer-rendered as a percentage when both
 * fields are present.
 *
 * @stable
 */
export interface ToolExecuteProgressEvent {
  readonly type: 'tool.execute.progress';
  readonly toolName: string;
  readonly toolCallId: string;
  readonly current: number;
  readonly total?: number;
  readonly message?: string;
  readonly stepNumber: number;
  readonly ts: number;
}

/**
 * Emitted by streaming-hint tools via `ctx.streamContent(...)`. Each
 * chunk is concatenated into the assembled `output` per the
 * buffer-becomes-output discipline. `chunkIndex` is monotone per
 * `(toolCallId)` so subscribers can detect drops.
 *
 * @stable
 */
export interface ToolExecutePartialEvent {
  readonly type: 'tool.execute.partial';
  readonly toolName: string;
  readonly toolCallId: string;
  readonly chunk: ContentChunk;
  readonly chunkIndex: number;
  readonly stepNumber: number;
  readonly ts: number;
}

/** @stable */
export interface ToolExecuteEndEvent {
  readonly type: 'tool.execute.end';
  readonly toolCallId: string;
  /** See {@link ToolExecuteStartEvent.toolName} (W-049). */
  readonly toolName?: string;
  readonly result: unknown;
  readonly durationMs: number;
}

/** @stable */
export interface ToolExecuteErrorEvent {
  readonly type: 'tool.execute.error';
  readonly toolCallId: string;
  /** See {@link ToolExecuteStartEvent.toolName} (W-049). */
  readonly toolName?: string;
  readonly error: ToolError;
}

/** @stable */
export interface ToolApprovalRequestedEvent {
  readonly type: 'tool.approval.requested';
  readonly toolCallId: string;
  readonly reason?: string;
}

/** @stable */
export interface ToolApprovalGrantedEvent {
  readonly type: 'tool.approval.granted';
  readonly toolCallId: string;
}

/** @stable */
export interface ToolApprovalDeniedEvent {
  readonly type: 'tool.approval.denied';
  readonly toolCallId: string;
  readonly reason?: string;
}

/**
 * Emitted when the runtime auto-compacts the in-flight session
 * message-history to fit the context window.
 *
 * @stable
 */
export interface ContextCompactedEvent {
  readonly type: 'context.compacted';
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly beforeTokens: number;
  readonly afterTokens: number;
  readonly summaryTokens: number;
  readonly durationMs: number;
  readonly source: 'auto-trigger' | 'manual' | 'pre-step';
  readonly hooksFiredCount: number;
}

/** @stable */
export interface HandoffEvent {
  readonly type: 'handoff';
  readonly fromAgentId: string;
  readonly toAgentId: string;
  readonly reason?: string;
}

/**
 * A provider-generated file surfaced from the model stream (AG-26) -
 * previously these `'file'` provider events were silently dropped.
 *
 * @stable
 */
export interface FileGeneratedEvent {
  readonly type: 'file.generated';
  readonly mimeType: string;
  readonly data: Uint8Array;
}

/**
 * A provider citation surfaced from the model stream (AG-26) -
 * previously these `'source'` provider events were silently dropped.
 *
 * @stable
 */
export interface SourceCitedEvent {
  readonly type: 'source.cited';
  readonly uri: string;
  readonly title?: string;
}

/** @stable */
export interface StepEndEvent {
  readonly type: 'step.end';
  readonly stepNumber: number;
  readonly usage: Usage;
}

/** @stable */
export interface GuardrailTrippedEvent {
  readonly type: 'guardrail.tripped';
  readonly guardrailName: string;
  readonly phase: 'input' | 'output';
  readonly reason?: string;
}

/**
 * Outcome of a terminal-response verifier check (C3). Emitted once per
 * verifier per verification round; a failed verifier's `feedback` is
 * also appended to the transcript so the model can address it.
 *
 * @stable
 */
export interface VerifierResultEvent {
  readonly type: 'verifier.result';
  readonly verifierId: string;
  readonly ok: boolean;
  readonly feedback?: string;
  readonly stepNumber: number;
}

/** @stable */
export interface AgentEndEvent<TOutput = string> {
  readonly type: 'agent.end';
  readonly runId: string;
  readonly result: AgentResult<TOutput>;
}

/** @stable */
export interface AgentErrorEvent {
  readonly type: 'agent.error';
  readonly error: { readonly message: string; readonly code: string };
}

/**
 * Emitted when `agent.steer(...)` queues an intervention to flow into
 * the next provider call within the current run.
 *
 * @stable
 */
export interface AgentSteeredEvent {
  readonly type: 'agent.steered';
  readonly runId: string;
}

/**
 * Emitted when `agent.followUp(...)` queues a follow-up turn to fire
 * after the current turn completes.
 *
 * @stable
 */
export interface AgentFollowUpQueuedEvent {
  readonly type: 'agent.followup.queued';
  readonly runId: string;
}

/**
 * Emitted at the moment `agent.abort({ ... })` is called, before any
 * pending tool / provider calls have terminated. Subscribers use this
 * to render "cancelling..." UI before the run actually winds down.
 *
 * @stable
 */
export interface AgentCancellingEvent {
  readonly type: 'agent.cancelling';
  readonly runId: string;
  readonly drain: boolean;
  readonly onPendingApprovals: 'deny' | 'hold' | 'fail';
}

/**
 * Emitted exactly once per agent-level model-fallback transition.
 * Identifies the failed primary, the next model in
 * `Agent.fallbackModels`, the eligible reason taxonomy, the
 * 1-based step number and the 1-based attempt index within the step.
 *
 * The event fires BEFORE the new model's stream starts so that
 * observers see the transition before any of the new model's
 * subsequent events flow.
 *
 * @stable
 */
export interface AgentModelFellbackEvent {
  readonly type: 'agent.model.fellback';
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly from: string;
  readonly to: string;
  readonly reason: 'rate-limit' | 'capacity' | 'context-length' | 'transient';
  readonly stepNumber: number;
  readonly attempt: number;
}

/**
 * Emitted when `Agent.fanOut(...)` begins to spawn its sub-agents.
 *
 * @stable
 */
export interface AgentFanOutSpawnedEvent {
  readonly type: 'agent.fanout.spawned';
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly fanOutId: string;
  readonly childCount: number;
  readonly mergeStrategyKind: 'concat' | 'first-success' | 'judge-merge' | 'custom';
  readonly spawnedAtIso: string;
}

/**
 * Per-child result entry surfaced on
 * {@link AgentFanOutMergedEvent.childMetadata}.
 *
 * @stable
 */
export interface FanOutChildMetadata {
  readonly agentId: string;
  readonly status: 'completed' | 'failed' | 'budget-exceeded' | 'cancelled';
  readonly tokensUsed: number;
  readonly toolCallCount: number;
  readonly durationMs: number;
}

/**
 * Emitted when the fan-out merge step completes.
 *
 * @stable
 */
export interface AgentFanOutMergedEvent {
  readonly type: 'agent.fanout.merged';
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly fanOutId: string;
  readonly childCount: number;
  readonly successfulChildCount: number;
  readonly mergeStrategyKind: 'concat' | 'first-success' | 'judge-merge' | 'custom';
  readonly mergeDurationMs: number;
  readonly childMetadata: ReadonlyArray<FanOutChildMetadata>;
}

/**
 * Emitted per iteration of an `evaluatorOptimizer({...})` loop.
 *
 * @stable
 */
export interface AgentEvaluatorIterationEvent {
  readonly type: 'agent.evaluator.iteration';
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly iteration: number;
  readonly score: number;
  readonly pass: boolean;
  readonly critique: string;
  readonly durationMs: number;
}

/**
 * Emitted at the termination of an `evaluatorOptimizer({...})` loop.
 *
 * @stable
 */
export interface AgentEvaluatorConvergedEvent {
  readonly type: 'agent.evaluator.converged';
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly totalIterations: number;
  readonly finalScore: number;
  readonly terminationReason: 'pass' | 'maxIterations' | 'generator-exhausted' | 'cancelled';
}

/**
 * Reference to a persisted progress artifact returned by
 * `agent.progress.write(...)` and `agent.progress.read(...)`.
 *
 * @stable
 */
export interface ProgressArtifactRef {
  readonly path: string;
  readonly role: string;
  readonly seq: number;
  readonly sizeBytes: number;
  readonly sensitivity: 'public' | 'internal' | 'secret';
  readonly tags?: ReadonlyArray<string>;
  readonly writtenAtIso: string;
  readonly sha256: string;
}

/**
 * Emitted after `agent.progress.write(...)` completes.
 *
 * @stable
 */
export interface AgentProgressWrittenEvent {
  readonly type: 'agent.progress.written';
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly ref: ProgressArtifactRef;
}

/**
 * Emitted after `agent.progress.read(...)` completes.
 *
 * @stable
 */
export interface AgentProgressReadEvent {
  readonly type: 'agent.progress.read';
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly refs: ReadonlyArray<ProgressArtifactRef>;
  readonly queriedRunId: string;
  readonly queriedRole: string | undefined;
}

/**
 * Lateral-leak vector classification surfaced on
 * {@link AgentLateralLeakDetectedEvent.vector}.
 *
 * - `'causality-laundering'` - the assistant message references
 *   information about a denied earlier action via an indirect chain.
 * - `'commentary-phase'`     - operator-only commentary content was
 *   about to escape the session-output boundary.
 * - `'sideways-injection'`   - a low-trust child of an
 *   `Agent.fanOut(...)` `'judge-merge'` strategy contributed
 *   disproportionately to the merged output.
 * - `'protocol-header'`      - control-character bytes or a
 *   protocol-frame separator was about to escape one of the
 *   internal-service delivery boundaries.
 *
 * @stable
 */
export type LateralLeakVector =
  | 'causality-laundering'
  | 'commentary-phase'
  | 'sideways-injection'
  | 'protocol-header';

/**
 * Emitted when the lateral-leak defense layer flags or blocks a
 * suspected leak.
 *
 * @stable
 */
export interface AgentLateralLeakDetectedEvent {
  readonly type: 'agent.lateral-leak.detected';
  readonly runId: string;
  readonly sessionId: string;
  readonly agentId: string;
  readonly vector: LateralLeakVector;
  readonly severity: 'info' | 'warn' | 'block';
  readonly causalityChain: ReadonlyArray<string>;
  readonly messageContentSha256: string;
  readonly matchedPattern?: string;
  readonly decision: 'detect' | 'flag' | 'strip' | 'block';
  readonly detectedAtIso: string;
}

/**
 * Final result of an agent run-loop invocation, returned by
 * `agent.run(...)` and carried by the `agent.end` event.
 *
 * A failed run **resolves** with `status: 'failed'` and the error in
 * `error` - `agent.run(...)` does not reject on run failure (only on
 * configuration/usage errors thrown before the loop starts). A suspended
 * run resolves with `status: 'awaiting_approval'` and a resumable
 * `state` (AG-9).
 *
 * @stable
 */
export interface AgentResult<TOutput = string> {
  readonly output: TOutput;
  readonly usage: Usage;
  /** Terminal status of this run-loop invocation. */
  readonly status: RunStatus;
  /** Populated when the run failed; mirrors `RunState.error`. */
  readonly error?: RunError;
  /**
   * B3 (item 15): the run's per-turn security verdicts (mirrors
   * `state.verdicts`). Surfaced directly so callers can apply them at
   * the `Session.push` boundary without digging into the state.
   */
  readonly verdicts?: RunVerdicts;
  /**
   * The run's final state. Resumable when `status === 'awaiting_approval'`
   * - pass it back to `agent.run(...)` / `agent.stream(...)` (optionally
   * round-tripped through `runStateToJSON`/`runStateFromJSON` for
   * durability). Treat as an immutable snapshot.
   */
  readonly state: RunState;
}
