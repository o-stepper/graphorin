/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * EB-1: the runner must offer a real-provider CLI path (so a maintainer can
 * seed real baselines) and stamp the provider provenance into every generated
 * RESULTS header - a stub run must never read as a real result. These tests
 * stay fully offline: a real provider is only *constructed* (HTTP adapters do
 * not touch the network until `generate()`), never called.
 */

import type { Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  buildResultsHeader,
  combineUnpricedModels,
  preflightUnpricedModels,
  resolveBenchApiKey,
  resolveBenchProvider,
  resolveJudgeSpec,
  withBenchCostCeiling,
} from '../src/runner.js';

describe('EB-1: real-provider resolution', () => {
  it('defaults to the offline stub, labelled plumbing-only', () => {
    const { provider, label } = resolveBenchProvider();
    expect(label).toBe('stub (plumbing-only)');
    expect(provider.name).toBe('stub');
  });

  it('treats an explicit "stub" name the same as the default', () => {
    const { label } = resolveBenchProvider({ name: 'stub' });
    expect(label).toBe('stub (plumbing-only)');
  });

  it('constructs a real Ollama provider from name + model (loopback default)', () => {
    const { provider, label } = resolveBenchProvider({ name: 'ollama', model: 'llama3.1' });
    expect(label).toBe('ollama:llama3.1');
    // A real provider, NOT the stub - and carrying the requested model id.
    expect(provider.name).not.toBe('stub');
    expect(provider.modelId).toBe('llama3.1');
  });

  it('requires a model for a real provider', () => {
    expect(() => resolveBenchProvider({ name: 'ollama' })).toThrow(/model/i);
  });

  it('requires a base URL for the openai-compatible provider', () => {
    expect(() => resolveBenchProvider({ name: 'openai-compatible', model: 'gpt-x' })).toThrow(
      /base[- ]?url/i,
    );
  });

  it('rejects an unknown provider name, naming the valid choices', () => {
    expect(() => resolveBenchProvider({ name: 'bogus', model: 'x' })).toThrow(/ollama/i);
  });
});

describe('EB-1: RESULTS provenance stamp', () => {
  it('stamps the stub disclaimer into the RESULTS header', () => {
    const header = buildResultsHeader('stub (plumbing-only)');
    expect(header).toContain('**Provider:** stub (plumbing-only)');
  });

  it('stamps a real provider label into the RESULTS header', () => {
    const header = buildResultsHeader('ollama:llama3.1');
    expect(header).toContain('**Provider:** ollama:llama3.1');
  });
});

describe('deep-retest 0.13.7 P3 - observed-cost reporting', () => {
  it('stamps observed cost (and unpriced models) into the RESULTS header', () => {
    const header = buildResultsHeader('ollama:llama3.1', {
      observedCostUsd: 0.000123,
      maxCostUsd: 0.1,
    });
    expect(header).toContain('**Observed cost (USD):** $0.000123 (cap $0.1)');
    expect(header).not.toContain('NO snapshot price');

    const unpriced = buildResultsHeader('ollama:llama3.1', {
      observedCostUsd: 0,
      maxCostUsd: 0.1,
      unpricedModels: ['mystery-model'],
    });
    expect(unpriced).toContain('NO snapshot price for: mystery-model');
  });

  it('withBenchCostCeiling names unpriced models for the benchConfig stamp', async () => {
    const usageProvider: Provider = {
      name: 'usage-reporter',
      modelId: 'model-not-in-snapshot',
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
      async generate(_req: ProviderRequest): Promise<ProviderResponse> {
        return {
          text: 'ok',
          usage: { promptTokens: 1000, completionTokens: 0, totalTokens: 1000 },
          finishReason: 'stop',
        };
      },
      stream(): AsyncIterable<never> {
        throw new Error('no stream');
      },
    };
    const ceiling = withBenchCostCeiling(2);
    await ceiling.wrap(usageProvider).generate({ messages: [{ role: 'user', content: 'hi' }] });
    expect(ceiling.observedCostUsd()).toBe(0);
    expect(ceiling.unpricedModels()).toEqual(['model-not-in-snapshot']);
  });

  it('deep-retest 0.13.8 P1: preflight names every model the cap cannot observe', () => {
    const withModel = (modelId: string): Provider => ({
      name: 'preflight-probe',
      modelId,
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
      async generate(): Promise<ProviderResponse> {
        throw new Error('preflight must never call the provider');
      },
      stream(): AsyncIterable<never> {
        throw new Error('no stream');
      },
    });
    // The ninth retest's exact shape: priced subject, judge on the
    // gpt-4o-mini alias - now priced, so the preflight stays silent.
    expect(preflightUnpricedModels([withModel('gpt-4.1-mini'), withModel('gpt-4o-mini')])).toEqual(
      [],
    );
    expect(
      preflightUnpricedModels([withModel('gpt-4.1-mini'), withModel('mystery-model')]),
    ).toEqual(['mystery-model']);
  });

  it('deep-retest 0.13.9 P2: report stamps union preflight knowledge with ceiling observations', () => {
    // The regression shape: --allow-unpriced-model with an endpoint
    // that dies before the first usage response. The ceiling observed
    // nothing, but the preflight already knew the model is unpriced -
    // costPricingMatched must come out false, not true.
    expect(combineUnpricedModels(['mystery-model'], [])).toEqual(['mystery-model']);
    expect(combineUnpricedModels(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(combineUnpricedModels([], [])).toEqual([]);
  });
});

describe('W-021: judge resolution from CLI + env', () => {
  it('returns undefined when no judge is named (unset or EMPTY env, as CI dispatch forms produce)', () => {
    expect(resolveJudgeSpec({}, {}, undefined)).toBeUndefined();
    expect(
      resolveJudgeSpec(
        {},
        { GRAPHORIN_BENCH_JUDGE_PROVIDER: '', GRAPHORIN_BENCH_JUDGE_MODEL: '' },
        'sut-key',
      ),
    ).toBeUndefined();
  });

  it('arms the judge from env, preferring the dedicated judge key', () => {
    const spec = resolveJudgeSpec(
      {},
      {
        GRAPHORIN_BENCH_JUDGE_PROVIDER: 'ollama',
        GRAPHORIN_BENCH_JUDGE_MODEL: 'judge-model',
        GRAPHORIN_BENCH_JUDGE_BASE_URL: 'http://judge.local:11434',
        GRAPHORIN_BENCH_JUDGE_API_KEY: 'judge-key',
      },
      'sut-key',
    );
    expect(spec).toEqual({
      name: 'ollama',
      model: 'judge-model',
      baseUrl: 'http://judge.local:11434',
      apiKey: 'judge-key',
    });
  });

  it('falls back to the SUT key when the judge key is unset or empty', () => {
    const viaUnset = resolveJudgeSpec(
      {},
      { GRAPHORIN_BENCH_JUDGE_PROVIDER: 'ollama', GRAPHORIN_BENCH_JUDGE_MODEL: 'm' },
      'sut-key',
    );
    expect(viaUnset?.apiKey).toBe('sut-key');
    const viaEmpty = resolveJudgeSpec(
      {},
      {
        GRAPHORIN_BENCH_JUDGE_PROVIDER: 'ollama',
        GRAPHORIN_BENCH_JUDGE_MODEL: 'm',
        GRAPHORIN_BENCH_JUDGE_API_KEY: '',
      },
      'sut-key',
    );
    expect(viaEmpty?.apiKey).toBe('sut-key');
  });

  it('CLI flags win over env, and the spec resolves to a REAL provider distinct from the SUT', () => {
    const spec = resolveJudgeSpec(
      { name: 'ollama', model: 'cli-model' },
      { GRAPHORIN_BENCH_JUDGE_PROVIDER: 'llamacpp', GRAPHORIN_BENCH_JUDGE_MODEL: 'env-model' },
      undefined,
    );
    expect(spec).toEqual({ name: 'ollama', model: 'cli-model' });
    const resolved = resolveBenchProvider(spec ?? {});
    expect(resolved.provider.name).not.toBe('stub');
    expect(resolved.label).toBe('ollama:cli-model');
  });
});

// deep-retest 0.13.12 P2: key preflight - the documented Graphorin
// variable was missed live and every case burned through as HTTP 401
// before a late exit. The resolver must accept the standard
// OPENAI_API_KEY for the official endpoint, fail fast when the
// official endpoint has no key at all, and leave loopback (llama-server
// and friends) legally keyless.
describe('deep-retest-0.13.12 P2: resolveBenchApiKey preflight', () => {
  it('prefers GRAPHORIN_BENCH_API_KEY regardless of endpoint', () => {
    const res = resolveBenchApiKey('openai-compatible', 'https://api.openai.com/v1', {
      GRAPHORIN_BENCH_API_KEY: 'dedicated',
      OPENAI_API_KEY: 'fallback',
    });
    expect(res).toEqual({ apiKey: 'dedicated', source: 'GRAPHORIN_BENCH_API_KEY' });
  });

  it('falls back to OPENAI_API_KEY for the official OpenAI endpoint', () => {
    const res = resolveBenchApiKey('openai-compatible', 'https://api.openai.com/v1', {
      OPENAI_API_KEY: 'fallback',
    });
    expect(res).toEqual({ apiKey: 'fallback', source: 'OPENAI_API_KEY' });
  });

  it('fails fast on the official endpoint with no key at all', () => {
    const res = resolveBenchApiKey('openai-compatible', 'https://api.openai.com/v1', {});
    expect(res.error).toMatch(/GRAPHORIN_BENCH_API_KEY/);
    expect(res.error).toMatch(/OPENAI_API_KEY/);
    expect(res.apiKey).toBeUndefined();
  });

  it('treats an empty dedicated key as unset', () => {
    const res = resolveBenchApiKey('openai-compatible', 'https://api.openai.com/v1', {
      GRAPHORIN_BENCH_API_KEY: '',
      OPENAI_API_KEY: 'fallback',
    });
    expect(res).toEqual({ apiKey: 'fallback', source: 'OPENAI_API_KEY' });
  });

  it('lets loopback endpoints run keyless without warning', () => {
    for (const url of ['http://127.0.0.1:18089/v1', 'http://localhost:11434/v1']) {
      const res = resolveBenchApiKey('openai-compatible', url, {});
      expect(res).toEqual({});
    }
  });

  it('warns (but does not fail) for a keyless non-official remote endpoint', () => {
    const res = resolveBenchApiKey('openai-compatible', 'https://llm.internal.example/v1', {});
    expect(res.error).toBeUndefined();
    expect(res.warning).toMatch(/llm\.internal\.example/);
  });

  it('does not demand keys for non-openai-compatible providers', () => {
    expect(resolveBenchApiKey('ollama', undefined, {})).toEqual({});
    expect(resolveBenchApiKey(undefined, undefined, {})).toEqual({});
  });

  it('ignores OPENAI_API_KEY for non-official endpoints (never leak the real key sideways)', () => {
    const res = resolveBenchApiKey('openai-compatible', 'https://llm.internal.example/v1', {
      OPENAI_API_KEY: 'real-key',
    });
    expect(res.apiKey).toBeUndefined();
  });
});

// deep-retest 0.13.12 P2: --timeout-ms threads into every adapter shape
// (construction only - the network is never touched before generate()).
describe('deep-retest-0.13.12 P2: timeoutMs threading', () => {
  it('constructs all three real adapters with a timeout override', () => {
    for (const spec of [
      { name: 'ollama', model: 'm', timeoutMs: 300000 },
      { name: 'llamacpp', model: 'm', timeoutMs: 300000 },
      {
        name: 'openai-compatible',
        model: 'm',
        baseUrl: 'http://127.0.0.1:9/v1',
        timeoutMs: 300000,
      },
    ]) {
      const { provider } = resolveBenchProvider(spec);
      expect(provider.name).not.toBe('stub');
    }
  });
});
