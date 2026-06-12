/**
 * Coverage for the per-provider model-tier auto-classifier.
 */
import type { Provider } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { InvalidProviderError } from '../../src/errors/errors.js';
import { CLASSIFIER_RULES, classifyModelTier } from '../../src/model-tier/classify.js';

const FIXTURE_CAPABILITIES = {
  streaming: true,
  toolCalling: true,
  parallelToolCalls: false,
  multimodal: false,
  structuredOutput: false,
  reasoning: false,
  contextWindow: 1024,
  maxOutput: 256,
} as const;

function provider(modelId: string): Provider {
  return {
    name: 'fixture',
    modelId,
    capabilities: FIXTURE_CAPABILITIES,
    async *stream() {
      /* no-op */
    },
    async generate() {
      return {
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop' as const,
      };
    },
  };
}

describe('classifyModelTier — per-family fixtures', () => {
  it.each([
    ['claude-haiku-4-5', 'fast'],
    ['anthropic/claude-sonnet-4-5', 'balanced'],
    ['claude-opus-4-7', 'smart'],
    // PS-20: real dated Anthropic ids carry multi-segment versions
    // (`3-5`, `3-7`) before the family word; the regex must match them.
    ['claude-3-5-haiku-20241022', 'fast'],
    ['claude-3-7-sonnet-20250219', 'balanced'],
    ['claude-fable-5', 'smart'],
    ['anthropic.claude-3-5-haiku-20241022', 'fast'],
    ['anthropic.claude-haiku-4', 'fast'],
    ['anthropic.claude-sonnet-4', 'balanced'],
    ['anthropic.claude-opus-4', 'smart'],
    ['gpt-5.5-mini', 'fast'],
    ['gpt-5.5-nano', 'fast'],
    ['gpt-5.5', 'balanced'],
    ['o1', 'smart'],
    ['o3-pro', 'smart'],
    ['gemini-2.5-flash', 'fast'],
    ['gemini-2.5-pro', 'balanced'],
    ['gemini-2.5-ultra', 'smart'],
  ] as const)('%s → %s', (modelId, tier) => {
    expect(classifyModelTier(provider(modelId))).toBe(tier);
  });

  it.each([
    ['ollama-llama3.1:70b'],
    ['unknown-provider/foo'],
    ['mistral-7b'],
  ] as const)('%s → undefined', (modelId) => {
    expect(classifyModelTier(provider(modelId))).toBeUndefined();
  });

  it('strips provider prefix using "/" separator', () => {
    expect(classifyModelTier(provider('openai/gpt-5.5'))).toBe('balanced');
  });

  it('strips provider prefix using ":" separator', () => {
    expect(classifyModelTier(provider('openai:gpt-5.5'))).toBe('balanced');
  });

  it('does NOT strip http:// URL-style prefixes', () => {
    expect(() => classifyModelTier(provider('http://localhost:8080'))).not.toThrow();
    // The URL fragment is not a known family, so the result is undefined.
    expect(classifyModelTier(provider('http://localhost:8080'))).toBeUndefined();
  });
});

describe('classifyModelTier — error paths', () => {
  it('throws InvalidProviderError on null provider', () => {
    expect(() => classifyModelTier(null as unknown as { name: string; modelId: string })).toThrow(
      InvalidProviderError,
    );
  });

  it('throws InvalidProviderError on empty modelId', () => {
    expect(() => classifyModelTier({ name: 'x', modelId: '' })).toThrow(InvalidProviderError);
  });

  it('throws InvalidProviderError on non-string modelId', () => {
    expect(() => classifyModelTier({ name: 'x', modelId: 5 as unknown as string })).toThrow(
      InvalidProviderError,
    );
  });
});

describe('CLASSIFIER_RULES', () => {
  it('is a frozen array with at least one entry per major family', () => {
    expect(Object.isFrozen(CLASSIFIER_RULES)).toBe(true);
    const families = new Set(CLASSIFIER_RULES.map((r) => r.family));
    expect(families.has('anthropic-haiku')).toBe(true);
    expect(families.has('anthropic-sonnet')).toBe(true);
    expect(families.has('anthropic-opus')).toBe(true);
    expect(families.has('anthropic-fable')).toBe(true); // PS-20
    expect(families.has('anthropic-mythos')).toBe(true);
    expect(families.has('openai-gpt')).toBe(true);
    expect(families.has('openai-reasoning')).toBe(true);
    expect(families.has('gemini-flash')).toBe(true);
    expect(families.has('gemini-pro')).toBe(true);
    expect(families.has('gemini-ultra')).toBe(true);
  });
});
