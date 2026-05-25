import type { Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  buildExpansionRequest,
  buildHydeRequest,
  createProviderQueryTransformer,
  DEFAULT_MAX_QUERY_VARIANTS,
  HYDE_SYSTEM_PROMPT,
  parseHypothetical,
  parseQueryVariants,
  QUERY_EXPANSION_SYSTEM_PROMPT,
  type QueryTransformer,
  type QueryTransformOptions,
} from '../src/search/index.js';

/** Provider stub that records requests and returns a fixed text. */
function fixedProvider(over: { text?: string; throws?: boolean } = {}): Provider & {
  readonly calls: ProviderRequest[];
} {
  const calls: ProviderRequest[] = [];
  return {
    name: 'fake',
    modelId: 'fake:test',
    capabilities: {
      streaming: false,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 32_000,
      maxOutput: 4_000,
    },
    calls,
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      calls.push(req);
      if (over.throws === true) throw new Error('boom');
      return {
        text: over.text ?? '',
        usage: { promptTokens: 7, completionTokens: 3, totalTokens: 10 },
        finishReason: 'stop',
      };
    },
    stream() {
      throw new Error('not implemented');
    },
  };
}

describe('parseQueryVariants (P2-3)', () => {
  it('parses a bare JSON array', () => {
    expect(parseQueryVariants('["a","b","c"]', 5)).toEqual(['a', 'b', 'c']);
  });

  it('caps the result at `max`', () => {
    expect(parseQueryVariants('["a","b","c","d"]', 2)).toEqual(['a', 'b']);
  });

  it('returns [] when max <= 0', () => {
    expect(parseQueryVariants('["a","b"]', 0)).toEqual([]);
  });

  it('unwraps a { variants: [...] } object', () => {
    expect(parseQueryVariants('{"variants":["x","y"]}', 5)).toEqual(['x', 'y']);
  });

  it('unwraps a { queries: [...] } object', () => {
    expect(parseQueryVariants('{"queries":["p","q"]}', 5)).toEqual(['p', 'q']);
  });

  it('tolerates a fenced JSON block', () => {
    expect(parseQueryVariants('```json\n["a","b"]\n```', 5)).toEqual(['a', 'b']);
  });

  it('slices a JSON array out of chatty prose', () => {
    expect(parseQueryVariants('Sure! Here you go:\n["a","b"]\nHope that helps.', 5)).toEqual([
      'a',
      'b',
    ]);
  });

  it('dedupes case-insensitively and drops empties', () => {
    expect(parseQueryVariants('["Foo","foo","  ","bar"]', 5)).toEqual(['Foo', 'bar']);
  });

  it('falls back to a newline / numbered list when not JSON', () => {
    expect(parseQueryVariants('1. first\n2) second\n- third', 5)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('returns [] for undefined / empty', () => {
    expect(parseQueryVariants(undefined, 5)).toEqual([]);
    expect(parseQueryVariants('', 5)).toEqual([]);
    expect(parseQueryVariants('   ', 5)).toEqual([]);
  });
});

describe('parseHypothetical (P2-3)', () => {
  it('returns the trimmed passage', () => {
    expect(parseHypothetical('  The answer is 42.  ')).toBe('The answer is 42.');
  });

  it('strips a fenced block', () => {
    expect(parseHypothetical('```\nA passage.\n```')).toBe('A passage.');
  });

  it('returns null for empty / whitespace / undefined', () => {
    expect(parseHypothetical('')).toBeNull();
    expect(parseHypothetical('   ')).toBeNull();
    expect(parseHypothetical(undefined)).toBeNull();
  });
});

describe('buildExpansionRequest / buildHydeRequest (P2-3)', () => {
  it('builds an expansion request with the system prompt + structured output', () => {
    const req = buildExpansionRequest('what did Anna say?', 3);
    expect(req.systemMessage).toBe(QUERY_EXPANSION_SYSTEM_PROMPT);
    expect(req.temperature).toBe(0.7);
    expect(req.maxTokens).toBe(256);
    expect(req.outputType).toEqual({ kind: 'structured' });
    expect(req.messages[0]?.content).toContain('what did Anna say?');
    expect(req.messages[0]?.content).toContain('up to 3');
  });

  it('threads maxTokens + signal into the expansion request', () => {
    const signal = new AbortController().signal;
    const req = buildExpansionRequest('q', 2, { maxTokens: 64, signal });
    expect(req.maxTokens).toBe(64);
    expect(req.signal).toBe(signal);
  });

  it('builds a HyDE request with the HyDE prompt and no structured output', () => {
    const req = buildHydeRequest('where are the docs?');
    expect(req.systemMessage).toBe(HYDE_SYSTEM_PROMPT);
    expect(req.temperature).toBe(0.3);
    expect(req.maxTokens).toBe(256);
    expect(req.outputType).toBeUndefined();
    expect(req.messages[0]?.content).toBe('where are the docs?');
  });
});

describe('createProviderQueryTransformer (P2-3)', () => {
  it('expands via the provider and caps at the requested count', async () => {
    const provider = fixedProvider({ text: '["v1","v2","v3"]' });
    const t = createProviderQueryTransformer(provider);
    expect(await t.expand('original', 2)).toEqual(['v1', 'v2']);
    expect(provider.calls).toHaveLength(1);
  });

  it('honours the maxVariants ceiling regardless of the requested count', async () => {
    const provider = fixedProvider({ text: '["v1","v2","v3"]' });
    const t = createProviderQueryTransformer(provider, { maxVariants: 1 });
    expect(await t.expand('original', 5)).toEqual(['v1']);
    expect(provider.calls[0]?.messages[0]?.content).toContain('up to 1');
  });

  it('makes no provider call for count 0 or an empty query', async () => {
    const provider = fixedProvider({ text: '["v1"]' });
    const t = createProviderQueryTransformer(provider);
    expect(await t.expand('original', 0)).toEqual([]);
    expect(await t.expand('   ', 3)).toEqual([]);
    expect(provider.calls).toHaveLength(0);
  });

  it('degrades to [] when the provider throws', async () => {
    const provider = fixedProvider({ throws: true });
    const t = createProviderQueryTransformer(provider);
    expect(await t.expand('original', 3)).toEqual([]);
  });

  it('returns the hypothetical passage', async () => {
    const provider = fixedProvider({ text: 'A plausible recalled fact.' });
    const t = createProviderQueryTransformer(provider);
    expect(await t.hypothetical('q')).toBe('A plausible recalled fact.');
  });

  it('returns null for an empty hypothetical or a throwing provider', async () => {
    expect(
      await createProviderQueryTransformer(fixedProvider({ text: '' })).hypothetical('q'),
    ).toBeNull();
    expect(
      await createProviderQueryTransformer(fixedProvider({ throws: true })).hypothetical('q'),
    ).toBeNull();
  });

  it('makes no provider call for an empty hypothetical query', async () => {
    const provider = fixedProvider({ text: 'x' });
    expect(await createProviderQueryTransformer(provider).hypothetical('  ')).toBeNull();
    expect(provider.calls).toHaveLength(0);
  });

  it('threads the abort signal into the provider request', async () => {
    const provider = fixedProvider({ text: '["v1"]' });
    const t = createProviderQueryTransformer(provider);
    const signal = new AbortController().signal;
    await t.expand('q', 1, { signal });
    expect(provider.calls[0]?.signal).toBe(signal);
  });
});

describe('types', () => {
  it('exposes the documented public shapes', () => {
    expectTypeOf(parseQueryVariants).returns.toEqualTypeOf<ReadonlyArray<string>>();
    expectTypeOf(parseHypothetical).returns.toEqualTypeOf<string | null>();
    expectTypeOf(buildExpansionRequest).returns.toMatchTypeOf<{
      readonly systemMessage?: string;
    }>();
    expectTypeOf(buildHydeRequest).returns.toMatchTypeOf<{ readonly systemMessage?: string }>();
    expectTypeOf(createProviderQueryTransformer).returns.toEqualTypeOf<QueryTransformer>();
    expectTypeOf(DEFAULT_MAX_QUERY_VARIANTS).toBeNumber();
    expectTypeOf<QueryTransformOptions>().toMatchTypeOf<{ readonly signal?: AbortSignal }>();
    expectTypeOf<QueryTransformer['expand']>().parameter(0).toBeString();
  });
});
