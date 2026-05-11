import type { Message } from '../types/message.js';

/**
 * Pluggable token counter. Implementations live in `@graphorin/provider`
 * (default `JsTiktokenCounter` for OpenAI/compatible, plus per-vendor
 * native counters) and are interchangeable behind this interface.
 *
 * Counters carry a `version` field so that consumers (e.g. the
 * `session_messages.tokenizer_version` cache column) can invalidate stale
 * cached counts when the underlying tokenizer is upgraded.
 *
 * @stable
 */
export interface TokenCounter {
  /** Human-readable identifier (`'js-tiktoken@cl100k_base'`, …). */
  readonly id: string;
  /** Tokenizer version string used for cache invalidation. */
  readonly version: string;
  /** Count tokens in a list of `Message`s (system/user/assistant/tool). */
  count(messages: ReadonlyArray<Message>): Promise<number>;
  /** Count tokens in a raw text string. */
  countText(text: string): Promise<number>;
}
