import type { Fact, MemoryHit, Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';

export function fact(id: string, text: string): Fact {
  return {
    id,
    kind: 'semantic',
    userId: 'u1',
    sensitivity: 'public',
    createdAt: '2026-01-01T00:00:00.000Z',
    text,
  };
}

export function hit(id: string, text: string, score: number): MemoryHit<Fact> {
  return {
    record: fact(id, text),
    score,
    signals: { vector: score },
  };
}

/**
 * Stub provider. The `respond` callback receives the most-recent
 * `ProviderRequest` and returns the integer the model would emit; the
 * test fixture assembles the surrounding `ProviderResponse` shape.
 */
export interface StubProviderInvocation {
  readonly request: ProviderRequest;
}

export function buildStubProvider(respond: (req: ProviderRequest) => string): {
  provider: Provider;
  calls: StubProviderInvocation[];
} {
  const calls: StubProviderInvocation[] = [];
  const provider: Provider = {
    name: 'stub',
    modelId: 'stub-model',
    capabilities: {
      streaming: false,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 4096,
      maxOutput: 1024,
    },
    stream(): AsyncIterable<never> {
      throw new Error('not used');
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      calls.push({ request: req });
      const text = respond(req);
      return {
        text,
        usage: {
          promptTokens: 100,
          completionTokens: 1,
          totalTokens: 101,
        },
        finishReason: 'stop',
      };
    },
  };
  return { provider, calls };
}
