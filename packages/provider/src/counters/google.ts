/**
 * `GoogleAPICounter` — placeholder counter that delegates to
 * `JsTiktokenCounter('cl100k_base')` for now. The full Google `:countTokens`
 * implementation lands in Phase 16 alongside the optional pricing
 * refresher; for v0.1 the proxy is sufficient (verified within ±5% on
 * the standard fixture corpus per the existing DEC-131 acceptance).
 *
 * @packageDocumentation
 */

import type { Message, TokenCounter } from '@graphorin/core';

import { JsTiktokenCounter } from './js-tiktoken.js';

/**
 * Options for {@link GoogleAPICounter}.
 *
 * @stable
 */
export interface GoogleAPICounterOptions {
  readonly modelId: string;
  readonly id?: string;
}

/**
 * @stable
 */
export class GoogleAPICounter implements TokenCounter {
  readonly id: string;
  readonly version: string;
  readonly #fallback: JsTiktokenCounter;

  constructor(options: GoogleAPICounterOptions) {
    this.#fallback = new JsTiktokenCounter({ encoding: 'cl100k_base', modelId: options.modelId });
    this.id = options.id ?? `google-proxy@${options.modelId}`;
    this.version = `google-cl100k-proxy-${options.modelId}-v1`;
  }

  count(messages: ReadonlyArray<Message>): Promise<number> {
    return this.#fallback.count(messages);
  }

  countText(text: string): Promise<number> {
    return this.#fallback.countText(text);
  }
}
