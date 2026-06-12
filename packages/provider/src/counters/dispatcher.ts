/**
 * `createDefaultCounter` — model-id classifier that returns the
 * recommended {@link TokenCounter} for a given `(provider, model)`
 * pair. The same classifier is reused by the model-tier dispatcher
 * (`@graphorin/provider/model-tier`) so provider-family detection
 * lives in exactly one place.
 *
 * @packageDocumentation
 */

import type { TokenCounter } from '@graphorin/core';

import { AnthropicAPICounter } from './anthropic.js';
import { BedrockAPICounter } from './bedrock.js';
import { GoogleAPICounter } from './google.js';
import { HeuristicCounter } from './heuristic.js';
import { JsTiktokenCounter } from './js-tiktoken.js';

/**
 * Options for {@link createDefaultCounter}.
 *
 * @stable
 */
export interface CreateDefaultCounterOptions {
  /** Concrete model id (e.g. `'gpt-4o'`, `'claude-opus-4-7'`). */
  readonly model: string;
  /** Optional provider hint to short-circuit the regex matching. */
  readonly provider?: string;
  /** Optional Anthropic API key threaded through to {@link AnthropicAPICounter}. */
  readonly anthropicApiKey?: string;
}

/**
 * Detect the provider family for a model id. Exposed for downstream
 * consumers (the model-tier classifier; future per-tool counters) so
 * provider-family detection is centralised here.
 *
 * @stable
 */
export function detectProviderFamily(args: {
  readonly model: string;
  readonly provider?: string;
}): 'anthropic' | 'openai' | 'google' | 'bedrock' | 'ollama' | 'openai-compatible' | 'unknown' {
  const provider = args.provider?.toLowerCase();
  const modelLower = args.model.toLowerCase();
  if (
    provider === 'anthropic' ||
    modelLower.startsWith('claude') ||
    modelLower.startsWith('anthropic.claude')
  ) {
    if (provider === 'bedrock' || modelLower.startsWith('anthropic.claude')) return 'bedrock';
    return 'anthropic';
  }
  if (provider === 'google' || modelLower.startsWith('gemini')) return 'google';
  if (provider === 'bedrock') return 'bedrock';
  if (provider === 'openai' || provider === 'azure-openai' || /^(gpt-|o1|o3|o4)/.test(modelLower)) {
    return 'openai';
  }
  if (provider === 'ollama' || modelLower.startsWith('ollama-')) return 'ollama';
  if (provider === 'openai-compatible' || provider === 'lmstudio' || provider === 'vllm') {
    return 'openai-compatible';
  }
  return 'unknown';
}

/**
 * Build the recommended {@link TokenCounter} for the given
 * `(provider, model)` pair. The dispatch table:
 *
 * - Anthropic Claude → `AnthropicAPICounter` (native if `apiKey` set,
 *   otherwise `cl100k_base` proxy).
 * - OpenAI / OpenAI-compatible → `JsTiktokenCounter('cl100k_base')`.
 * - Google Gemini → `GoogleAPICounter` (cl100k_base proxy in v0.1).
 * - Bedrock Claude → `BedrockAPICounter` (cl100k_base proxy in v0.1).
 * - Ollama / unknown → `HeuristicCounter` with one WARN per process.
 *
 * @stable
 */
export function createDefaultCounter(options: CreateDefaultCounterOptions): TokenCounter {
  const family = detectProviderFamily({
    model: options.model,
    ...(options.provider !== undefined ? { provider: options.provider } : {}),
  });
  switch (family) {
    case 'anthropic':
      return new AnthropicAPICounter({
        modelId: options.model,
        ...(options.anthropicApiKey !== undefined ? { apiKey: options.anthropicApiKey } : {}),
      });
    case 'bedrock':
      return new BedrockAPICounter({ modelId: options.model });
    case 'google':
      return new GoogleAPICounter({ modelId: options.model });
    case 'openai':
    case 'openai-compatible':
      return new JsTiktokenCounter({
        encoding: defaultOpenAiEncoding(options.model),
        modelId: options.model,
      });
    default:
      return new HeuristicCounter({ modelId: options.model });
  }
}

/**
 * PS-20: pick the fallback tiktoken encoding by model family. `js-tiktoken`'s
 * `encodingForModel` handles ids it recognises; this is the explicit fallback
 * for ids it does not (the 2025/2026 families). gpt-4o / gpt-4.1 / gpt-5+ and
 * the o-series reasoning models use `o200k_base`; legacy gpt-4 / gpt-3.5 stay
 * on `cl100k_base`.
 */
export function defaultOpenAiEncoding(model: string | undefined): 'o200k_base' | 'cl100k_base' {
  if (model === undefined) return 'cl100k_base';
  const id = model.toLowerCase();
  const sep = Math.max(id.lastIndexOf('/'), id.lastIndexOf(':'));
  const bare = sep === -1 ? id : id.slice(sep + 1);
  return /^(?:gpt-4o|gpt-4\.1|gpt-[5-9]|gpt-\d{2}|o[1-9])/.test(bare)
    ? 'o200k_base'
    : 'cl100k_base';
}
