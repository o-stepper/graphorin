/**
 * Coverage for the model-id classifier dispatcher.
 */
import { describe, expect, it } from 'vitest';

import { AnthropicAPICounter } from '../../src/counters/anthropic.js';
import { BedrockAPICounter } from '../../src/counters/bedrock.js';
import { createDefaultCounter, detectProviderFamily } from '../../src/counters/dispatcher.js';
import { GoogleAPICounter } from '../../src/counters/google.js';
import { HeuristicCounter } from '../../src/counters/heuristic.js';
import { JsTiktokenCounter } from '../../src/counters/js-tiktoken.js';

describe('detectProviderFamily', () => {
  it('detects anthropic from claude- prefix', () => {
    expect(detectProviderFamily({ model: 'claude-haiku-4-5' })).toBe('anthropic');
  });

  it('detects bedrock when the model uses anthropic.claude prefix', () => {
    expect(detectProviderFamily({ model: 'anthropic.claude-sonnet-4' })).toBe('bedrock');
  });

  it('detects bedrock when provider is "bedrock" regardless of model', () => {
    expect(detectProviderFamily({ model: 'whatever', provider: 'bedrock' })).toBe('bedrock');
  });

  it('detects google from gemini prefix', () => {
    expect(detectProviderFamily({ model: 'gemini-2.5-pro' })).toBe('google');
    expect(detectProviderFamily({ model: 'whatever', provider: 'google' })).toBe('google');
  });

  it('detects openai from gpt-, o1-, o3- and provider hints', () => {
    expect(detectProviderFamily({ model: 'gpt-5.5' })).toBe('openai');
    expect(detectProviderFamily({ model: 'o1' })).toBe('openai');
    expect(detectProviderFamily({ model: 'o3-pro' })).toBe('openai');
    expect(detectProviderFamily({ model: 'whatever', provider: 'azure-openai' })).toBe('openai');
    expect(detectProviderFamily({ model: 'whatever', provider: 'openai' })).toBe('openai');
  });

  it('detects ollama from provider name and ollama- prefix', () => {
    expect(detectProviderFamily({ model: 'ollama-llama3.1' })).toBe('ollama');
    expect(detectProviderFamily({ model: 'whatever', provider: 'ollama' })).toBe('ollama');
  });

  it('detects openai-compatible from lmstudio / vllm hints', () => {
    expect(detectProviderFamily({ model: 'm', provider: 'lmstudio' })).toBe('openai-compatible');
    expect(detectProviderFamily({ model: 'm', provider: 'vllm' })).toBe('openai-compatible');
    expect(detectProviderFamily({ model: 'm', provider: 'openai-compatible' })).toBe(
      'openai-compatible',
    );
  });

  it('returns unknown for the residual', () => {
    expect(detectProviderFamily({ model: 'mystery-model' })).toBe('unknown');
  });
});

describe('createDefaultCounter', () => {
  it('returns AnthropicAPICounter for claude- models and forwards apiKey', () => {
    const c = createDefaultCounter({ model: 'claude-haiku-4-5', anthropicApiKey: 'k' });
    expect(c).toBeInstanceOf(AnthropicAPICounter);
  });

  it('returns BedrockAPICounter for anthropic.claude models', () => {
    const c = createDefaultCounter({ model: 'anthropic.claude-sonnet-4' });
    expect(c).toBeInstanceOf(BedrockAPICounter);
  });

  it('returns GoogleAPICounter for gemini models', () => {
    const c = createDefaultCounter({ model: 'gemini-2.5-pro' });
    expect(c).toBeInstanceOf(GoogleAPICounter);
  });

  it('returns JsTiktokenCounter for openai / openai-compatible models', () => {
    expect(createDefaultCounter({ model: 'gpt-5.5' })).toBeInstanceOf(JsTiktokenCounter);
    expect(createDefaultCounter({ model: 'm', provider: 'openai-compatible' })).toBeInstanceOf(
      JsTiktokenCounter,
    );
  });

  it('returns HeuristicCounter for ollama / unknown', () => {
    expect(createDefaultCounter({ model: 'ollama-llama3.1' })).toBeInstanceOf(HeuristicCounter);
    expect(createDefaultCounter({ model: 'mystery' })).toBeInstanceOf(HeuristicCounter);
  });

  // PS-20: the OpenAI fallback encoding must track the model family — gpt-4o /
  // gpt-4.1 / gpt-5+ / o-series use o200k_base; legacy gpt-4 / gpt-3.5 stay on
  // cl100k_base. The counter's `version` carries the resolved encoding.
  it.each([
    ['gpt-4o', 'o200k_base'],
    ['gpt-4o-mini', 'o200k_base'],
    ['gpt-4.1', 'o200k_base'],
    ['gpt-5.5', 'o200k_base'],
    ['o3-pro', 'o200k_base'],
    ['gpt-4', 'cl100k_base'],
    ['gpt-4-turbo', 'cl100k_base'],
    ['gpt-3.5-turbo', 'cl100k_base'],
  ] as const)('selects %s → %s', (model, encoding) => {
    const c = createDefaultCounter({ model });
    expect(c).toBeInstanceOf(JsTiktokenCounter);
    expect(c.version).toContain(encoding);
  });
});
