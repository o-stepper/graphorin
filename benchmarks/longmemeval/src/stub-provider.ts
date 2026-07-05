/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Deterministic, offline stub `Provider` for the LongMemEval smoke test
 * (and the default `main()` path). No model, no network. Mirrors the
 * established benchmark/test-fixture pattern
 * (`benchmarks/tool-agent/src/mock-provider.ts`,
 * `packages/reranker-llm/tests/_fixtures.ts`).
 *
 * Inject a real `Provider` via `runLongMemEvalBenchmark({ provider })`
 * for meaningful scores - the stub only proves the harness plumbing.
 */

import type { Message, Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';

/** Build a stub provider whose `generate` returns whatever `respond` decides. */
export function createStubProvider(respond: (req: ProviderRequest) => string): Provider {
  return {
    name: 'stub',
    modelId: 'stub-longmemeval',
    capabilities: {
      streaming: false,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 8192,
      maxOutput: 1024,
    },
    stream(): AsyncIterable<never> {
      throw new Error('[benchmark-longmemeval] stub provider: stream() unused; call generate().');
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      return {
        text: respond(req),
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop',
      };
    },
  };
}

/**
 * The default offline stub. It plays two roles depending on the prompt:
 *
 *  - **judge** (system prompt mentions "evaluator"/"grader") → returns a
 *    passing `SCORE: <n>` line in the marker format `llmJudge` parses (EB-7);
 *  - **agent** (everything else) → echoes the most salient line of the
 *    supplied MEMORY context, or an explicit "no information" answer when
 *    the context is empty (so abstention cases behave sensibly offline).
 */
export function createDefaultStubProvider(): Provider {
  return createStubProvider((req) => {
    if (/evaluator|grader/i.test(req.systemMessage ?? '')) return 'SCORE: 8';
    const memory = extractMemoryBlock(lastUserText(req));
    return memory.length > 0 ? memory : 'I do not have that information in memory.';
  });
}

function lastUserText(req: ProviderRequest): string {
  const userMessages = req.messages.filter((m: Message) => m.role === 'user');
  const last = userMessages[userMessages.length - 1];
  if (last === undefined) return '';
  if (typeof last.content === 'string') return last.content;
  return last.content
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('')
    .trim();
}

/** Pull the first non-empty line of the "MEMORY:" block from the agent prompt. */
function extractMemoryBlock(userText: string): string {
  const match = /MEMORY:\n([\s\S]*?)\n\n(?:CURRENT DATE:|QUESTION:)/.exec(userText);
  const block = match?.[1] ?? '';
  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return '';
}
