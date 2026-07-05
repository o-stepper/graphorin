/**
 * `LlamaCppNativeCounter` - token counter that wraps the loaded
 * `node-llama-cpp` model's `tokenize(text)` function. The counter is
 * strictly tighter than the cl100k_base proxy because it uses the
 * exact tokenizer the GGUF file embeds.
 *
 * @packageDocumentation
 */

import type { Message, TokenCounter } from '@graphorin/core';
import { serialiseMessageForCount, serializedToString } from '@graphorin/provider/counters';

import type { LlamaModelInstance } from './runtime.js';

/**
 * Options for {@link LlamaCppNativeCounter}.
 *
 * @stable
 */
export interface LlamaCppNativeCounterOptions {
  readonly model: LlamaModelInstance;
  readonly modelPath?: string;
  readonly id?: string;
}

/**
 * Counter that delegates to `model.tokenize(text)` from the loaded
 * GGUF instance. Cache invalidation is keyed on the model file path
 * (when supplied) so swapping models invalidates per-message caches
 * upstream.
 *
 * @stable
 */
export class LlamaCppNativeCounter implements TokenCounter {
  readonly id: string;
  readonly version: string;
  readonly #model: LlamaModelInstance;

  constructor(options: LlamaCppNativeCounterOptions) {
    this.#model = options.model;
    const fingerprint = options.modelPath !== undefined ? hash(options.modelPath) : 'unknown';
    this.id = options.id ?? `llama-cpp-native@${fingerprint}`;
    this.version = `llama-cpp-native-${fingerprint}-v1`;
  }

  async count(messages: ReadonlyArray<Message>): Promise<number> {
    let total = 0;
    for (const msg of messages) {
      const serialised = serialiseMessageForCount(msg);
      total += this.#tokenLengthOf(serializedToString(serialised));
    }
    return total;
  }

  async countText(text: string): Promise<number> {
    if (text.length === 0) return 0;
    return this.#tokenLengthOf(text);
  }

  #tokenLengthOf(text: string): number {
    if (text.length === 0) return 0;
    const tokens = this.#model.tokenize(text);
    if (tokens === null || tokens === undefined) return 0;
    if (typeof (tokens as { length?: number }).length === 'number') {
      return (tokens as { length: number }).length;
    }
    return 0;
  }
}

function hash(value: string): string {
  // Lightweight deterministic fingerprint - the framework only needs
  // it for cache invalidation, not for cryptographic purposes.
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16);
}
