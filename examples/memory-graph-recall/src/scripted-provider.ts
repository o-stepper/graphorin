/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Hand-rolled scripted `Provider` for the deep-recall demo. Mirrors
 * the `fakeProvider` idiom from the framework's own
 * `packages/memory/tests/consolidator-runtime.test.ts`: the provider
 * replays a fixed plan of pre-scripted `ProviderResponse`s, one per
 * `generate(...)` call, and records every inbound `ProviderRequest`
 * so the flow (and the smoke test) can assert exactly how many grade
 * calls the iterative-retrieval loop made. Fully offline and
 * deterministic - no socket, no child process, no wall-clock
 * dependence.
 */

import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { zeroUsage } from '@graphorin/core';

/** A {@link Provider} that also exposes its recorded call log. */
export interface ScriptedProvider extends Provider {
  /** Every request received so far, in call order. */
  readonly calls: ReadonlyArray<ProviderRequest>;
}

/**
 * Build a provider that answers `generate(...)` from `plan`, strictly
 * in order. A call beyond the end of the plan throws - inside the
 * retrieval grader that error degrades to the fail-safe "stop" grade,
 * and the drifted call count is what the smoke test catches.
 */
export function createScriptedProvider(plan: ReadonlyArray<ProviderResponse>): ScriptedProvider {
  let cursor = 0;
  const calls: ProviderRequest[] = [];
  const provider: ScriptedProvider = {
    name: 'scripted',
    modelId: 'scripted:memory-graph-recall',
    capabilities: {
      streaming: true,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 32_000,
      maxOutput: 4_000,
      reasoningContract: 'optional',
    },
    acceptsSensitivity: ['public', 'internal', 'secret'],
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      calls.push(req);
      const next = plan[cursor];
      cursor += 1;
      if (next === undefined) {
        throw new Error(
          `[graphorin/example-memory-graph-recall] scripted provider exhausted after ` +
            `${plan.length} planned responses (call #${calls.length}).`,
        );
      }
      return next;
    },
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      const response = await provider.generate(req);
      yield {
        type: 'stream-start',
        metadata: { providerName: 'scripted', modelId: 'scripted:memory-graph-recall' },
      };
      yield { type: 'text-delta', delta: response.text ?? '' };
      yield { type: 'finish', finishReason: response.finishReason, usage: response.usage };
    },
    calls,
  };
  return provider;
}

/**
 * Convenience for scripting a retrieval-grader verdict: the grader
 * prompt asks for a bare JSON object
 * `{ sufficient, confidence, reformulation, reason }` (see
 * `RETRIEVAL_GRADE_SYSTEM_PROMPT` in `@graphorin/memory`), and this
 * helper renders one as a zero-usage `ProviderResponse`.
 */
export function gradeResponse(grade: {
  readonly sufficient: boolean;
  readonly confidence: number;
  readonly reformulation: string | null;
  readonly reason: string;
}): ProviderResponse {
  return {
    text: JSON.stringify(grade),
    usage: zeroUsage(),
    finishReason: 'stop',
  };
}
