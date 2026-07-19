/**
 * The per-step provider fallback chain of the agent run loop: streams
 * the primary provider (emitting the accumulated agent events), applies
 * the abort semantics, retries a hard context overflow once after
 * an emergency compaction, walks the configured
 * fallback providers on eligible errors (emitting
 * `agent.model.fellback`), and records a terminal provider failure on
 * the run state. Extracted verbatim from `factory.ts` (issue #23); the
 * former in-loop chain now takes an explicit {@link FallbackChainEnv}
 * and returns a {@link ProviderChainOutcome} instead of finishing the
 * run itself (`failed: true` tells the loop to finish).
 *
 * @packageDocumentation
 */

import type {
  AgentEvent,
  FinishReason,
  Message,
  Provider,
  ProviderError,
  ProviderRequest,
  ReasoningContent,
  RunState,
  ToolCall,
  Usage,
} from '@graphorin/core';
import { zeroUsage } from '@graphorin/core';
import { AgentRuntimeError } from '../errors/index.js';
import { type AgentFallbackPolicy, isAgentFallbackEligible } from '../fallback/index.js';
import type { PreferredModelResolution } from '../preferred-model/index.js';
import type { AbortOptions } from '../types.js';
import { accumulateUsage, addUsage, buildStepMessages } from './messages.js';
import {
  classifyThrownProviderErrorKind,
  handleProviderEvent,
  type ProviderEventCollector,
  type ToolCallAccumulator,
} from './provider-events.js';
import type { MutableRunState } from './run-input.js';

/**
 * The run-scoped context the chain operates on. Field names mirror the
 * run-loop locals the former inline chain captured; `getPendingAbort` /
 * `getActiveTodos` are live reads of the factory's mutable scratch, and
 * `tryEmergencyCompact` is pre-bound to the run's compaction env.
 */
export interface FallbackChainEnv<TOutput> {
  readonly state: MutableRunState & RunState;
  readonly messages: Message[];
  readonly sessionId: string;
  readonly agentId: string;
  readonly signal: AbortSignal;
  readonly fallbackPolicy: AgentFallbackPolicy;
  readonly structuredInstruction: string | undefined;
  readonly getPendingAbort: () => AbortOptions | undefined;
  readonly getActiveTodos: () => ReadonlyArray<import('@graphorin/core').TodoItem> | undefined;
  readonly tryEmergencyCompact: () => AsyncGenerator<AgentEvent<TOutput>, boolean, void>;
}

/** What one step's provider chain resolved to (read by the run loop). */
export interface ProviderChainOutcome {
  /**
   * `true` when the chain recorded a terminal provider failure on the
   * run state (the `agent.error` event already streamed) - the loop
   * must finish the run.
   */
  readonly failed: boolean;
  readonly modelSucceeded: boolean;
  readonly textBuffer: string;
  readonly finalCalls: ToolCall[];
  readonly stepReasoningParts: ReasoningContent[];
  readonly stepUsage: Usage;
  readonly lastModelId: string;
  /**
   * Why the successful provider call ended; recorded on the step so
   * `'length'` (output truncated at the token ceiling) is observable.
   * Absent when no provider call completed.
   */
  readonly finishReason?: FinishReason;
}

export async function* runProviderFallbackChain<TOutput>(
  env: FallbackChainEnv<TOutput>,
  fallbackChain: Provider[],
  baseRequest: ProviderRequest,
  primary: PreferredModelResolution,
  stepNumber: number,
): AsyncGenerator<AgentEvent<TOutput>, ProviderChainOutcome, void> {
  const { state, messages, sessionId, agentId, signal, fallbackPolicy } = env;
  const { structuredInstruction, getPendingAbort, getActiveTodos, tryEmergencyCompact } = env;

  const stepUsage: Usage = zeroUsage();
  let attempt = 0;
  let textBuffer = '';
  let providerForStep = primary.resolvedProvider;
  let lastModelId = primary.resolvedModelId;
  let modelSucceeded = false;
  let lastError: ProviderError | undefined;
  let finalCalls: ToolCall[] = [];
  let stepReasoningParts: ReasoningContent[] = [];
  let stepFinishReason: FinishReason | undefined;
  // context-engine-06: the request actually sent - rebuilt after an
  // emergency compaction so the retry carries the shrunk buffer
  // even on the structured-output path (which snapshots messages).
  let requestForStep = baseRequest;
  let emergencyCompactTried = false;

  for (let chainIdx = 0; chainIdx < fallbackChain.length; chainIdx++) {
    const candidate = fallbackChain[chainIdx];
    if (candidate === undefined) continue;
    providerForStep = candidate;
    const providerModelId = providerForStep.modelId;
    if (chainIdx > 0) {
      attempt += 1;
      const reason = lastError
        ? (isAgentFallbackEligible(lastError, fallbackPolicy).reason ?? 'transient')
        : 'transient';
      yield {
        type: 'agent.model.fellback',
        runId: state.id,
        sessionId,
        agentId,
        from: lastModelId,
        to: providerModelId,
        reason,
        stepNumber,
        attempt,
      };
      lastModelId = providerModelId;
    }
    const evState: ProviderEventCollector = {
      textBuffer: '',
      reasoningBuffer: '',
      reasoningParts: [],
      calls: new Map<string, ToolCallAccumulator>(),
      finalCalls: [] as ToolCall[],
    };
    let providerError: ProviderError | undefined;
    let providerCallCompleted = false;
    let providerFinishReason: FinishReason | undefined;
    let providerStepUsage: Usage = zeroUsage();
    try {
      const stream = providerForStep.stream(requestForStep);
      for await (const ev of stream) {
        // AG-6 `drain`: the default hard-kills the in-flight provider
        // stream mid-event; `abort({ drain: true })` instead lets the
        // current step finish (the documented "wait for the current step
        // to complete") and stops gracefully at the next loop-top check.
        if (signal.aborted && getPendingAbort()?.drain !== true) {
          throw new AgentRuntimeError('run-aborted', 'aborted');
        }
        const out = handleProviderEvent(ev, evState);
        if (out.emit !== undefined) {
          yield out.emit as AgentEvent<TOutput>;
        }
        if (out.providerError !== undefined) {
          providerError = out.providerError;
        }
        if (out.usage !== undefined) {
          providerStepUsage = addUsage(providerStepUsage, out.usage);
        }
        if (out.finishReason !== undefined) providerFinishReason = out.finishReason;
        if (out.finished === true) providerCallCompleted = true;
      }
    } catch (cause) {
      // AG-6: a mid-stream abort (our run-aborted sentinel, or any error
      // once the signal is aborted - e.g. a native AbortError from the
      // provider) is NOT a provider failure. Break out of the fallback
      // chain WITHOUT a providerError; the post-stream abort check below
      // ends the run as 'aborted', never 'no-provider-completed'. Don't
      // continue the fallback chain against an already-aborted signal.
      if (signal.aborted || (cause instanceof AgentRuntimeError && cause.code === 'run-aborted')) {
        break;
      }
      const message = cause instanceof Error ? cause.message : String(cause);
      // AG-21: preserve the thrown error's kind (e.g. a RateLimitExceededError
      // from `withRateLimit`) so the fallback chain treats it like the same
      // error emitted as a structured event, instead of flattening it to
      // an always-ineligible 'unknown'.
      providerError = { kind: classifyThrownProviderErrorKind(cause), message, cause };
    }
    if (providerError !== undefined) {
      lastError = providerError;
      // context-engine-06: a hard context overflow gets ONE
      // emergency-compaction retry against the SAME candidate
      // before the fallback chain (whose members usually share the
      // window) or a terminal failure.
      if (providerError.kind === 'context-length' && !emergencyCompactTried) {
        emergencyCompactTried = true;
        const shrank = yield* tryEmergencyCompact();
        if (shrank) {
          requestForStep = {
            ...baseRequest,
            messages: buildStepMessages(messages, structuredInstruction, getActiveTodos()),
          };
          chainIdx -= 1; // negate the loop increment: retry this candidate
          continue;
        }
      }
      const eligibility = isAgentFallbackEligible(providerError, fallbackPolicy);
      if (!eligibility.eligible || chainIdx === fallbackChain.length - 1) {
        yield {
          type: 'agent.error',
          error: { message: providerError.message, code: providerError.kind },
        };
        state.status = 'failed';
        state.error = { message: providerError.message, code: providerError.kind };
        return {
          failed: true,
          modelSucceeded,
          textBuffer,
          finalCalls,
          stepReasoningParts,
          stepUsage,
          lastModelId,
        };
      }
      continue;
    }
    if (providerCallCompleted) {
      // Deep-retest 0.13.1 P1: a stream can finish - typically
      // `finishReason: 'length'`, the output-token ceiling - while a
      // tool call's argument JSON is still streaming (a
      // `tool-call-start` with no `tool-call-end`). The call can never
      // be dispatched, so completing the run would report success for
      // a side effect that was never executed. Emit a terminal event
      // per cut call and fail the run with a typed error instead. No
      // fallback retry: the next provider would get the same request
      // and ceiling, so the truncation would recur.
      const closedIds = new Set(evState.finalCalls.map((call) => call.toolCallId));
      const unclosedCalls = [...evState.calls.values()].filter(
        (acc) => !closedIds.has(acc.toolCallId),
      );
      if (unclosedCalls.length > 0) {
        const reason = providerFinishReason ?? 'stop';
        for (const acc of unclosedCalls) {
          yield {
            type: 'tool.call.incomplete',
            toolCallId: acc.toolCallId,
            toolName: acc.toolName,
            finishReason: reason,
            argsPrefix: acc.argsBuffer,
          };
        }
        accumulateUsage(stepUsage, providerStepUsage);
        const names = unclosedCalls.map((acc) => acc.toolName).join(', ');
        const message =
          `provider stream finished ('${reason}') with ${unclosedCalls.length} ` +
          `unfinished tool call(s): ${names}. The tool was never executed; raise ` +
          'the output-token budget (maxTokens) or simplify the tool arguments.';
        yield { type: 'agent.error', error: { message, code: 'incomplete-tool-call' } };
        state.status = 'failed';
        state.error = { message, code: 'incomplete-tool-call' };
        return {
          failed: true,
          modelSucceeded,
          textBuffer,
          finalCalls,
          stepReasoningParts,
          stepUsage,
          lastModelId,
        };
      }
      modelSucceeded = true;
      stepFinishReason = providerFinishReason;
      textBuffer = evState.textBuffer;
      finalCalls = evState.finalCalls;
      // W-024: adapters with per-block structure ('reasoning-end'
      // terminators) produce reasoningParts carrying the provider's
      // round-trip meta (thinking signatures) - use them as-is, plus a
      // meta-less tail for any deltas after the last terminator. The
      // single-part collapse remains the fallback for adapters without
      // block structure (ollama, openai-shaped, llamacpp).
      if (evState.reasoningParts.length > 0) {
        stepReasoningParts = [
          ...evState.reasoningParts,
          ...(evState.reasoningBuffer.length > 0
            ? [{ type: 'reasoning' as const, text: evState.reasoningBuffer }]
            : []),
        ];
      } else if (evState.reasoningBuffer.length > 0) {
        stepReasoningParts = [
          {
            type: 'reasoning',
            text: evState.reasoningBuffer,
          },
        ];
      }
      accumulateUsage(stepUsage, providerStepUsage);
      break;
    }
  }

  return {
    failed: false,
    modelSucceeded,
    textBuffer,
    finalCalls,
    stepReasoningParts,
    stepUsage,
    lastModelId,
    ...(stepFinishReason !== undefined ? { finishReason: stepFinishReason } : {}),
  };
}
