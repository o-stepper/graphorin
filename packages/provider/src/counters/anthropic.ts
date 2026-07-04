/**
 * `AnthropicAPICounter` — uses Anthropic's native count-tokens
 * endpoint when an API key is configured, otherwise falls back to
 * `JsTiktokenCounter`. The native call is opt-in: the user supplies
 * an explicit `apiKey`. The framework never makes the call without
 * one.
 *
 * @packageDocumentation
 */

import type { Message, TokenCounter } from '@graphorin/core';

import { stripTrailingSlashes } from '../internal/url-utils.js';
import { toAnthropicCountPayload } from './anthropic-wire.js';
import { JsTiktokenCounter } from './js-tiktoken.js';

/**
 * Options for {@link AnthropicAPICounter}.
 *
 * @stable
 */
export interface AnthropicAPICounterOptions {
  readonly modelId: string;
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
  /** Identifier carried on the produced counter. */
  readonly id?: string;
  /**
   * Log sink for the WARN emitted (once per counter) when the native
   * call degrades to the tiktoken fallback. Defaults to `console.warn`.
   */
  readonly logger?: (message: string, meta?: object) => void;
}

/**
 * Counter that talks to `POST /v1/messages/count_tokens` when an API
 * key is configured. Without an API key, the counter delegates to
 * `JsTiktokenCounter('cl100k_base')` — the closest publicly-available
 * proxy for Anthropic's tokenizer.
 *
 * @stable
 */
export class AnthropicAPICounter implements TokenCounter {
  readonly id: string;
  readonly version: string;
  readonly #modelId: string;
  readonly #apiKey?: string;
  readonly #baseUrl: string;
  readonly #fetchImpl: typeof fetch;
  readonly #fallback: JsTiktokenCounter;
  readonly #logger: (message: string, meta?: object) => void;
  #fallbackWarned = false;

  constructor(options: AnthropicAPICounterOptions) {
    this.#modelId = options.modelId;
    if (options.apiKey !== undefined) this.#apiKey = options.apiKey;
    this.#baseUrl = stripTrailingSlashes(options.baseUrl ?? 'https://api.anthropic.com');
    this.#fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.#fallback = new JsTiktokenCounter({ encoding: 'cl100k_base', modelId: options.modelId });
    this.#logger = options.logger ?? ((message, meta) => console.warn(message, meta ?? ''));
    this.id = options.id ?? `anthropic-native@${options.modelId}`;
    this.version = `anthropic-native-${options.modelId}-v1`;
  }

  async count(messages: ReadonlyArray<Message>): Promise<number> {
    if (this.#apiKey === undefined) return this.#fallback.count(messages);
    // core-provider-04: the endpoint accepts only Anthropic wire-shaped
    // bodies. Posting Graphorin messages 400s on any transcript with a
    // system / tool message or `toolCalls`, so convert first.
    const payload = toAnthropicCountPayload(messages);
    if (payload === null) return this.#fallback.count(messages);
    try {
      const resp = await this.#fetchImpl(`${this.#baseUrl}/v1/messages/count_tokens`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.#apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: this.#modelId, ...payload }),
      });
      if (!resp.ok) {
        this.#warnFallback(`HTTP ${resp.status}`);
        return this.#fallback.count(messages);
      }
      const json = (await resp.json()) as { input_tokens?: number };
      if (typeof json.input_tokens === 'number') return json.input_tokens;
      this.#warnFallback('response missing input_tokens');
      return this.#fallback.count(messages);
    } catch (cause) {
      this.#warnFallback((cause as Error).message);
      return this.#fallback.count(messages);
    }
  }

  async countText(text: string): Promise<number> {
    return this.#fallback.countText(text);
  }

  /**
   * WARN once per counter when the native path degrades — a silent
   * fallback to cl100k tiktoken undercounts Claude tokens by ~15-20%,
   * so the degradation must be visible.
   */
  #warnFallback(reason: string): void {
    if (this.#fallbackWarned) return;
    this.#fallbackWarned = true;
    this.#logger(
      `[graphorin/provider] AnthropicAPICounter(${this.#modelId}): native count_tokens failed (${reason}); ` +
        'falling back to cl100k tiktoken (undercounts Claude by ~15-20%). Further fallbacks are silent.',
    );
  }
}
