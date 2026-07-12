/**
 * The run-level gates the agent loop applies to its inputs and outputs:
 * input / output guardrail screening (AG-2 / SDF-4), the structured
 * output contract (AG-3: the JSON-only instruction, fence stripping,
 * parse + validation), the lateral-leak commit gate on outgoing
 * assistant content (RB-55 / AG-10), the verifier gate on terminal
 * responses (C3), and the shared cancellation path (AG-6). Extracted
 * verbatim from `factory.ts` (issue #23).
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';
import type {
  AgentEvent,
  AssistantMessage,
  Message,
  ReasoningContent,
  ReasoningRetention,
  RunState,
  RunTurnVerdict,
  ToolCall,
} from '@graphorin/core';
import { composeGuardrails, type InputGuardrail } from '@graphorin/security/guardrails';
import type { CausalityMonitor } from '../lateral-leak/causality-monitor.js';
import type { buildDataFlowGuard } from '../tooling/dataflow.js';
import type { AbortOptions, AgentConfig, VerifierResult } from '../types.js';
import { buildAssistantMessage } from './messages.js';
import type { InternalRunSnapshot, MutableRunState } from './run-input.js';

/**
 * B3 (item 15): merge one turn's verdict into the run's plain-object
 * sidecar. Widen-only: 'block' beats 'rewrite', flags accumulate,
 * nothing is ever cleared here (compaction owns removal). Keys are
 * `'<stepNumber>:<offsetInStep>'`; step 0 is the pre-step input
 * stage.
 */
export function stampTurnVerdict(
  state: MutableRunState & RunState,
  stepNumber: number,
  offset: number,
  verdict: RunTurnVerdict,
): void {
  const key = `${stepNumber}:${offset}`;
  const existing = state.verdicts?.[key];
  const guardrail =
    existing?.guardrail === 'block' || verdict.guardrail === 'block'
      ? ('block' as const)
      : (verdict.guardrail ?? existing?.guardrail);
  const flags = [
    ...new Set([...(existing?.dataflowFlags ?? []), ...(verdict.dataflowFlags ?? [])]),
  ];
  const merged: RunTurnVerdict = {
    ...(guardrail !== undefined ? { guardrail } : {}),
    ...(existing?.lateralLeak === true || verdict.lateralLeak === true
      ? { lateralLeak: true }
      : {}),
    ...(flags.length > 0 ? { dataflowFlags: flags } : {}),
  };
  state.verdicts = { ...(state.verdicts ?? {}), [key]: merged };
}

const sha256Hex = (input: string): string =>
  createHash('sha256').update(input, 'utf8').digest('hex');

/**
 * Replacement content committed in place of assistant commentary the
 * causality monitor blocked (AG-10). Worded to not match any built-in
 * denial pattern, so the notice itself never re-triggers the monitor.
 */
export const LATERAL_LEAK_BLOCKED_NOTICE =
  '[graphorin] assistant commentary withheld by the lateral-leak defense.';

/**
 * Strip a single Markdown code fence around a JSON payload (AG-3).
 * Models often wrap structured output in ```json fences even when told
 * not to. ReDoS-safe: the info string is matched with `[^\n]*`.
 */
export function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const match = /^```[^\n]*\n([\s\S]*?)\n?```$/.exec(trimmed);
  return match?.[1] ?? trimmed;
}

/**
 * The AG-3 fallback instruction: one trailing system message that
 * pins JSON-only output and embeds the wire schema / description.
 * This is the documented structured-output contract for adapters that
 * do not yet consume `ProviderRequest.outputType` natively (PS-24).
 */
export function buildStructuredInstruction(spec: {
  readonly description?: string;
  readonly jsonSchema?: Readonly<Record<string, unknown>>;
}): string {
  const parts = [
    'Respond with a single valid JSON value only - no prose, no Markdown code fences.',
  ];
  if (spec.description !== undefined && spec.description.length > 0) {
    parts.push(spec.description);
  }
  if (spec.jsonSchema !== undefined) {
    parts.push(`The JSON MUST conform to this JSON Schema:\n${JSON.stringify(spec.jsonSchema)}`);
  }
  return parts.join('\n');
}

export { sha256Hex };

/** The run-scoped context the cancellation path operates on. */
export interface CancellationEnv {
  readonly state: MutableRunState & RunState;
  readonly messages: Message[];
  readonly getPendingAbort: () => AbortOptions | undefined;
}

/**
 * AG-6: shared cancellation path for the loop-top abort check, a
 * mid-stream provider abort, and the abort-during-suspend seam (W-038).
 * Yields `agent.cancelling`, applies the `onPendingApprovals` policy,
 * and returns `true` when the run was finalized as 'failed' (the 'fail'
 * policy WITH live approvals - the caller must `return finalize(...)`);
 * otherwise it sets `state.status = 'aborted'` and returns `false`.
 *
 * Policy semantics (W-038):
 * - `'deny'`: drain every pending approval AND commit a matching tool
 *   message per drained toolCallId - the transcript must not keep a
 *   dangling `tool_use` real providers reject on a later resume.
 * - `'hold'`: keep `pendingApprovals` on the aborted state; resume is
 *   possible only through an explicit directive.
 * - `'fail'`: fail the run ONLY when approvals are actually pending -
 *   an abort with an empty queue is a plain 'aborted', per the
 *   documented contract.
 */
export async function* emitCancellation<TOutput>(
  env: CancellationEnv,
): AsyncGenerator<AgentEvent<TOutput>, boolean, void> {
  const { state, messages, getPendingAbort } = env;
  yield {
    type: 'agent.cancelling',
    runId: state.id,
    drain: getPendingAbort()?.drain ?? false,
    onPendingApprovals: getPendingAbort()?.onPendingApprovals ?? 'deny',
  };
  const policy = getPendingAbort()?.onPendingApprovals ?? 'deny';
  if (policy === 'deny') {
    const drained = state.pendingApprovals.splice(0, state.pendingApprovals.length);
    for (const approval of drained) {
      yield {
        type: 'tool.approval.denied',
        toolCallId: approval.toolCallId,
        reason: 'auto-denied: agent.abort()',
      };
      const text = 'Error: tool approval denied: auto-denied on abort';
      messages.push({ role: 'tool', toolCallId: approval.toolCallId, content: text });
      state.messages.push({ role: 'tool', toolCallId: approval.toolCallId, content: text });
    }
  } else if (policy === 'fail' && state.pendingApprovals.length > 0) {
    state.status = 'failed';
    state.error = { message: 'aborted with pending approvals', code: 'run-aborted' };
    yield {
      type: 'agent.error',
      error: { message: 'aborted with pending approvals', code: 'run-aborted' },
    };
    return true;
  }
  state.status = 'aborted';
  return false;
}

/** The run-scoped context the input-guardrail screen operates on. */
export interface GuardrailScreenEnv {
  readonly state: MutableRunState & RunState;
  readonly messages: Message[];
  readonly sessionId: string;
  readonly agentId: string;
}

/**
 * AG-2 / SDF-4: input guardrails screen each fresh-run seed user
 * message (string content) BEFORE the first provider call, using the
 * canonical `@graphorin/security` composer. 'block' fails the run
 * without reaching the model; 'rewrite' replaces the content in both
 * the working buffer and the persisted RunState; 'warn' logs and
 * continues. Resumed runs skip the pass - their seed was screened
 * when first submitted.
 *
 * Returns `true` when a guardrail blocked the run (the failure is
 * already recorded on `state` and streamed - the loop must finish).
 */
export async function* screenInputGuardrails<TOutput>(
  env: GuardrailScreenEnv,
  inputGuards: ReadonlyArray<InputGuardrail<string>>,
): AsyncGenerator<AgentEvent<TOutput>, boolean, void> {
  const { state, messages, sessionId, agentId } = env;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg === undefined || msg.role !== 'user' || typeof msg.content !== 'string') continue;
    const composed = await composeGuardrails(inputGuards, msg.content, {
      stage: 'input',
      runId: state.id,
      sessionId,
      agentId,
    });
    if (!composed.ok) {
      yield {
        type: 'guardrail.tripped',
        guardrailName: composed.name,
        phase: 'input',
        reason: composed.message,
      };
      const message = `input guardrail '${composed.name}' blocked the run: ${composed.message}`;
      yield { type: 'agent.error', error: { message, code: 'guardrail-blocked' } };
      state.status = 'failed';
      state.error = { message, code: 'guardrail-blocked' };
      // B3: pre-step input stage = step 0; offset = buffer index.
      stampTurnVerdict(state, 0, i, { guardrail: 'block' });
      return true;
    }
    if (composed.value !== msg.content) {
      const rewritten: Message = { ...msg, content: composed.value };
      const stateIdx = state.messages.indexOf(msg);
      messages[i] = rewritten;
      if (stateIdx !== -1) state.messages[stateIdx] = rewritten;
      stampTurnVerdict(state, 0, i, { guardrail: 'rewrite' });
    }
  }
  return false;
}

/** The run-scoped context the assistant-commit gate operates on. */
export interface AssistantCommitEnv {
  readonly state: MutableRunState & RunState;
  readonly messages: Message[];
  readonly sessionId: string;
  readonly agentId: string;
  readonly causalityMonitor: CausalityMonitor | undefined;
  readonly toolDataFlowGuard: ReturnType<typeof buildDataFlowGuard> | undefined;
}

/**
 * Lateral-leak (RB-55 / AG-10): scan the outgoing assistant
 * content BEFORE it is appended, so a 'block' decision keeps
 * the laundered commentary out of the durable history - and
 * therefore out of every subsequent provider request. The
 * deltas already streamed; what 'block' protects is the
 * persistent buffer and the run's final output.
 *
 * Commits the (possibly replaced) assistant message to both buffers,
 * records the C6 taint span, and emits `agent.lateral-leak.detected`
 * when the monitor tripped. Returns `leakBlocked`.
 */
export async function* commitAssistantMessage<TOutput>(
  env: AssistantCommitEnv,
  textBuffer: string,
  stepReasoningParts: ReadonlyArray<ReasoningContent>,
  finalCalls: ReadonlyArray<ToolCall>,
  reasoningPolicy: ReasoningRetention,
  stepNumber = 0,
): AsyncGenerator<AgentEvent<TOutput>, boolean, void> {
  const { state, messages, sessionId, agentId, causalityMonitor, toolDataFlowGuard } = env;
  const leakCheck =
    causalityMonitor !== undefined && textBuffer.length > 0
      ? causalityMonitor.checkMessage(textBuffer)
      : undefined;
  const leakBlocked = leakCheck?.leakDetected === true && leakCheck.decision === 'block';

  const assistant: AssistantMessage = buildAssistantMessage(
    leakBlocked ? LATERAL_LEAK_BLOCKED_NOTICE : textBuffer,
    stepReasoningParts,
    finalCalls,
    agentId,
    reasoningPolicy,
  );
  messages.push(assistant);
  state.messages.push(assistant);

  // B3: a withheld assistant turn carries a durable verdict so the
  // Session.push boundary + memory ingest gate can keep the (blocked)
  // turn out of long-term memory.
  if (leakBlocked) {
    stampTurnVerdict(state, stepNumber, 0, { lateralLeak: true });
  }

  // C6: once the run is tainted, the model's own TEXT output is
  // derived from untrusted context - record it so a later sink call
  // copying the model's phrasing still trips the verbatim probe
  // (no-op on untainted runs). Tool-call args are deliberately NOT
  // recorded: the sink gate inspects those same args next, and
  // recording them first would self-match every post-taint call,
  // collapsing the precise verbatim signal into the coarse one.
  if (toolDataFlowGuard !== undefined && textBuffer.length > 0 && !leakBlocked) {
    toolDataFlowGuard.recordAssistant(state.id, textBuffer);
  }

  if (leakCheck?.leakDetected === true) {
    const sha = sha256Hex(textBuffer);
    yield {
      type: 'agent.lateral-leak.detected',
      runId: state.id,
      sessionId,
      agentId,
      vector: leakCheck.vector,
      severity: leakCheck.severity,
      causalityChain: leakCheck.causalityChain,
      messageContentSha256: sha,
      ...(leakCheck.matchedPattern !== undefined
        ? { matchedPattern: leakCheck.matchedPattern }
        : {}),
      decision: leakCheck.decision,
      detectedAtIso: new Date().toISOString(),
    };
  }
  return leakBlocked;
}

/** The run-scoped context the verifier gate operates on. */
export interface VerifierGateEnv<TDeps, TOutput> {
  readonly config: Pick<AgentConfig<TDeps, TOutput>, 'verifiers' | 'maxVerifierRounds'>;
  readonly state: MutableRunState & RunState;
  readonly messages: Message[];
}

/** Outcome of one verifier gate pass (read by the run loop). */
export interface VerifierGateResult {
  /** `true`: feedback was fed back - the loop takes another step. */
  readonly continueRun: boolean;
  /** The continuation rounds consumed so far (threaded back to the loop). */
  readonly verifierRoundsUsed: number;
}

/**
 * C3: verifier seam - deterministic checks run on EVERY terminal
 * response (so the outcome is always observable via
 * verifier.result events). Failures feed structured feedback back
 * as a user message and the loop continues, but only while
 * continuation rounds remain (maxVerifierRounds, default 1);
 * exhausted rounds complete with the last output. A verifier that
 * throws is treated as passed (a buggy verifier must not fail the
 * run).
 */
export async function* runVerifierGate<TDeps, TOutput>(
  env: VerifierGateEnv<TDeps, TOutput>,
  finalSnapshot: InternalRunSnapshot<TOutput>,
  stepNumber: number,
  verifierRoundsUsed: number,
): AsyncGenerator<AgentEvent<TOutput>, VerifierGateResult, void> {
  const { config, state, messages } = env;
  if (config.verifiers !== undefined && config.verifiers.length > 0) {
    const feedbacks: string[] = [];
    for (const verifier of config.verifiers) {
      let result: VerifierResult;
      try {
        result = await verifier.verify({
          output: String(finalSnapshot.output ?? ''),
          state,
          stepNumber,
        });
      } catch {
        result = { ok: true };
      }
      yield {
        type: 'verifier.result',
        verifierId: verifier.id,
        ok: result.ok,
        ...(result.ok ? {} : { feedback: result.feedback }),
        stepNumber,
      };
      if (!result.ok) feedbacks.push(`[verifier:${verifier.id}] ${result.feedback}`);
    }
    if (feedbacks.length > 0 && verifierRoundsUsed < (config.maxVerifierRounds ?? 1)) {
      const feedbackMessage: Message = {
        role: 'user',
        content: `Your response failed ${feedbacks.length} verification check(s). Address the feedback and answer again:\n${feedbacks.join('\n')}`,
      };
      messages.push(feedbackMessage);
      state.messages.push(feedbackMessage);
      return { continueRun: true, verifierRoundsUsed: verifierRoundsUsed + 1 };
    }
  }
  return { continueRun: false, verifierRoundsUsed };
}

/** The run-scoped context the terminal output phases operate on. */
export interface RunOutputEnv<TDeps, TOutput> {
  readonly config: AgentConfig<TDeps, TOutput>;
  readonly state: MutableRunState & RunState;
  readonly sessionId: string;
  readonly agentId: string;
  readonly stopWhen: { readonly description: string };
}

/**
 * The terminal output phases of a run, in their frozen order: the AG-24
 * stop-condition cut check, the AG-3 structured-output parse +
 * validation (before output guardrails, so they screen the PARSED
 * value), and the AG-2 / SDF-4 output guardrail screen. Mutates
 * `state` / `finalSnapshot` exactly as the inline blocks did.
 */
export async function* finalizeRunOutput<TDeps, TOutput>(
  env: RunOutputEnv<TDeps, TOutput>,
  finalSnapshot: InternalRunSnapshot<TOutput>,
): AsyncGenerator<AgentEvent<TOutput>, void, void> {
  const { config, state, sessionId, agentId, stopWhen } = env;
  if (state.status === 'running') {
    // AG-24: the loop exited via the stop condition (default
    // isStepCount(50)) with work still pending - that is a CUT run,
    // not a completion. Surface it as a typed failure so consumers
    // can tell it apart from a clean finish.
    const message = `run stopped by stop condition: ${stopWhen.description}`;
    state.status = 'failed';
    state.error = { message, code: 'stop-condition' };
    yield { type: 'agent.error', error: { message, code: 'stop-condition' } };
  }
  // AG-3: structured output is parsed + validated on the completed
  // path - a failure is a typed run failure (`output-validation-failed`),
  // never a silent text-cast. Runs BEFORE output guardrails so they
  // screen the PARSED value.
  if (state.status === 'completed' && config.outputType?.kind === 'structured') {
    const raw = String(finalSnapshot.output ?? '');
    try {
      const parsed: unknown = JSON.parse(stripJsonFence(raw));
      finalSnapshot.output = (
        config.outputType.schema !== undefined ? config.outputType.schema.parse(parsed) : parsed
      ) as TOutput;
    } catch (cause) {
      const message = `structured output validation failed: ${
        cause instanceof Error ? cause.message : String(cause)
      }`;
      yield { type: 'agent.error', error: { message, code: 'output-validation-failed' } };
      state.status = 'failed';
      state.error = { message, code: 'output-validation-failed' };
    }
  }

  // AG-2 / SDF-4: output guardrails screen the final output on the
  // completed path before `agent.end`. 'block' fails the run;
  // 'rewrite' replaces the durable result (`result.output`) - the
  // text deltas were already streamed, so the rewrite governs what
  // is persisted/returned, not the live token stream.
  const outputGuards = config.guardrails?.output;
  if (state.status === 'completed' && outputGuards !== undefined && outputGuards.length > 0) {
    const composed = await composeGuardrails(outputGuards, finalSnapshot.output, {
      stage: 'output',
      runId: state.id,
      sessionId,
      agentId,
    });
    if (!composed.ok) {
      yield {
        type: 'guardrail.tripped',
        guardrailName: composed.name,
        phase: 'output',
        reason: composed.message,
      };
      const message = `output guardrail '${composed.name}' blocked the run: ${composed.message}`;
      yield { type: 'agent.error', error: { message, code: 'guardrail-blocked' } };
      state.status = 'failed';
      state.error = { message, code: 'guardrail-blocked' };
      // B3: the final output belongs to the last step's assistant turn.
      stampTurnVerdict(state, lastStepNumber(state), 0, { guardrail: 'block' });
    } else if (composed.value !== finalSnapshot.output) {
      finalSnapshot.output = composed.value;
      stampTurnVerdict(state, lastStepNumber(state), 0, { guardrail: 'rewrite' });
    }
  }
}

/** Highest step number recorded on the run (0 before the first step). */
function lastStepNumber(state: RunState): number {
  let max = 0;
  for (const step of state.steps) {
    if (step.stepNumber > max) max = step.stepNumber;
  }
  return max;
}
