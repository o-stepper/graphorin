/**
 * `createReplayProvider(state)` — a Provider that replays the model
 * responses journaled on `RunState.steps[].providerResponse` (C3, opt-in
 * via `AgentConfig.recordProviderResponses`). Re-running the same input
 * against a replay provider reproduces the original run deterministically
 * with zero live model calls — the mocked-completion harness that gives
 * agent loops reproducible integration tests.
 *
 * The provider is strict by design: it throws when the state carries no
 * journaled responses, and emits an error event when the replayed run
 * asks for more steps than were recorded (a divergence, not a fixture
 * gap — fail loudly instead of hallucinating a response).
 *
 * @packageDocumentation
 */

import type {
  Provider,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  RunState,
  RunStepProviderResponse,
} from '@graphorin/core';

/** Options for {@link createReplayProvider}. */
export interface ReplayProviderOptions {
  /** Provider name for spans/logs. Default `'replay'`. */
  readonly name?: string;
}

/**
 * Build a Provider that serves the journaled step responses in order.
 *
 * @stable
 */
export function createReplayProvider(
  state: RunState,
  options: ReplayProviderOptions = {},
): Provider {
  const recorded: RunStepProviderResponse[] = [];
  for (const step of state.steps) {
    if (step.providerResponse !== undefined) recorded.push(step.providerResponse);
  }
  if (recorded.length === 0) {
    throw new TypeError(
      'createReplayProvider: RunState carries no journaled provider responses — ' +
        'run the original agent with recordProviderResponses: true.',
    );
  }
  let cursor = 0;
  const modelId = recorded[0]?.modelId ?? 'replay';

  function nextRecorded(): RunStepProviderResponse | undefined {
    const entry = recorded[cursor];
    cursor += 1;
    return entry;
  }

  return {
    name: options.name ?? 'replay',
    modelId,
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 1_000_000,
      maxOutput: 1_000_000,
    },
    async *stream(_req: ProviderRequest): AsyncIterable<ProviderEvent> {
      const entry = nextRecorded();
      if (entry === undefined) {
        yield {
          type: 'error',
          error: {
            kind: 'unknown',
            message: `replay exhausted after ${recorded.length} recorded step(s) — the replayed run diverged from the original`,
          },
        };
        return;
      }
      yield { type: 'stream-start', metadata: { providerName: 'replay', modelId: entry.modelId } };
      if (entry.text !== undefined && entry.text.length > 0) {
        yield { type: 'text-delta', delta: entry.text };
      }
      for (const call of entry.toolCalls ?? []) {
        yield { type: 'tool-call-start', toolCallId: call.toolCallId, toolName: call.toolName };
        yield {
          type: 'tool-call-input-delta',
          toolCallId: call.toolCallId,
          argsDelta: JSON.stringify(call.args),
        };
        yield { type: 'tool-call-end', toolCallId: call.toolCallId, finalArgs: call.args };
      }
      yield {
        type: 'finish',
        finishReason: (entry.toolCalls?.length ?? 0) > 0 ? 'tool-calls' : 'stop',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    },
    async generate(_req: ProviderRequest): Promise<ProviderResponse> {
      const entry = nextRecorded();
      if (entry === undefined) {
        throw new Error(
          `replay exhausted after ${recorded.length} recorded step(s) — the replayed run diverged from the original`,
        );
      }
      return {
        ...(entry.text !== undefined ? { text: entry.text } : {}),
        ...(entry.toolCalls !== undefined && entry.toolCalls.length > 0
          ? { toolCalls: entry.toolCalls.map((c) => ({ ...c })) }
          : {}),
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: (entry.toolCalls?.length ?? 0) > 0 ? 'tool-calls' : 'stop',
      };
    },
  };
}
