/**
 * `BedrockAPICounter` — placeholder counter that delegates to
 * `JsTiktokenCounter('cl100k_base')` for now (Bedrock's native
 * `count_tokens` API requires AWS Signature v4; full integration
 * lands in Phase 16). The proxy is sufficient for v0.1 within the
 * documented ±5% accuracy envelope.
 *
 * @packageDocumentation
 */

import type { Message, TokenCounter } from '@graphorin/core';

import { JsTiktokenCounter } from './js-tiktoken.js';

/**
 * Options for {@link BedrockAPICounter}.
 *
 * @stable
 */
export interface BedrockAPICounterOptions {
  readonly modelId: string;
  readonly id?: string;
}

/**
 * @stable
 */
export class BedrockAPICounter implements TokenCounter {
  readonly id: string;
  readonly version: string;
  readonly #fallback: JsTiktokenCounter;

  constructor(options: BedrockAPICounterOptions) {
    this.#fallback = new JsTiktokenCounter({ encoding: 'cl100k_base', modelId: options.modelId });
    this.id = options.id ?? `bedrock-proxy@${options.modelId}`;
    this.version = `bedrock-cl100k-proxy-${options.modelId}-v1`;
  }

  count(messages: ReadonlyArray<Message>): Promise<number> {
    return this.#fallback.count(messages);
  }

  countText(text: string): Promise<number> {
    return this.#fallback.countText(text);
  }
}
