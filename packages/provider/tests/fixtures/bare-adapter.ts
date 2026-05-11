import type { Provider } from '@graphorin/core';

/**
 * Tiny adapter fixture used across the test suite. Yields one
 * `text-delta` followed by a `finish` event; `generate()` returns a
 * canned response.
 */
export function bareAdapter(): Provider {
  return {
    name: 'bare',
    modelId: 'bare-model',
    capabilities: {
      streaming: true,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 1024,
      maxOutput: 256,
    },
    async *stream() {
      yield { type: 'text-delta' as const, delta: 'hi' };
      yield {
        type: 'finish' as const,
        finishReason: 'stop' as const,
        usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
      };
    },
    async generate() {
      return {
        text: 'hi',
        usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
        finishReason: 'stop' as const,
      };
    },
  };
}
