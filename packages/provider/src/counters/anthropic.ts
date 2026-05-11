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

  constructor(options: AnthropicAPICounterOptions) {
    this.#modelId = options.modelId;
    if (options.apiKey !== undefined) this.#apiKey = options.apiKey;
    this.#baseUrl = (options.baseUrl ?? 'https://api.anthropic.com').replace(/\/+$/, '');
    this.#fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.#fallback = new JsTiktokenCounter({ encoding: 'cl100k_base', modelId: options.modelId });
    this.id = options.id ?? `anthropic-native@${options.modelId}`;
    this.version = `anthropic-native-${options.modelId}-v1`;
  }

  async count(messages: ReadonlyArray<Message>): Promise<number> {
    if (this.#apiKey === undefined) return this.#fallback.count(messages);
    try {
      const resp = await this.#fetchImpl(`${this.#baseUrl}/v1/messages/count_tokens`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.#apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: this.#modelId, messages }),
      });
      if (!resp.ok) return this.#fallback.count(messages);
      const json = (await resp.json()) as { input_tokens?: number };
      if (typeof json.input_tokens === 'number') return json.input_tokens;
      return this.#fallback.count(messages);
    } catch {
      return this.#fallback.count(messages);
    }
  }

  async countText(text: string): Promise<number> {
    return this.#fallback.countText(text);
  }
}
