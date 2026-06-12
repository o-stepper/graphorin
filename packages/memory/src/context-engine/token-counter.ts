/**
 * Token-counting helpers used by the {@link ContextEngine}. The
 * production path accepts a {@link TokenCounter} from
 * `@graphorin/core` (the default `JsTiktokenCounter` lives in
 * `@graphorin/provider`); the fallback path is a deterministic
 * heuristic that keeps unit tests dependency-free.
 *
 * The fallback counts ~1 token per 4 characters — close enough for
 * budgeting decisions, intentionally less precise than a real BPE
 * tokenizer. Production deployments wire a real
 * {@link TokenCounter} through `createMemory({ contextEngine: {
 * tokenCounter: ... } })`.
 *
 * @packageDocumentation
 */

import type { Message, TokenCounter } from '@graphorin/core';

/**
 * Pluggable text-token counter used inside the ContextEngine. The
 * surface is narrower than {@link TokenCounter} because the engine
 * never assembles a message list during the budget-allocation
 * phase — it operates on rendered text fragments.
 *
 * @stable
 */
export interface ContextTokenCounter {
  readonly id: string;
  countText(text: string): Promise<number>;
}

/**
 * Script-aware heuristic (CE-13). The flat chars/4 rule undercounts
 * non-Latin scripts ~4x — real tokenizers emit roughly one token per
 * CJK character (and per kana / hangul syllable), so a 200k-window
 * threshold expressed in "heuristic tokens" let CJK conversations blow
 * past the provider limit before compaction ever fired. Characters
 * outside the Latin-ish range count at one token each; Latin text keeps
 * the classic chars/4. Still a heuristic — wire a real `TokenCounter`
 * (e.g. the provider package's JsTiktokenCounter) for production
 * accuracy.
 */
const DENSE_SCRIPT_RE =
  // CJK unified + extensions, kana, hangul, CJK punctuation, full-width forms.
  /[ᄀ-ᇿ⺀-〿぀-ヿ㄰-㆏ㇰ-䶿一-鿿ꥠ-꥿가-퟿豈-﫿＀-￯]/g;

/**
 * Built-in heuristic counter — chars/4 for Latin-ish text plus one
 * token per dense-script (CJK/kana/hangul) character (CE-13). Stable
 * default when the operator does not pass a real {@link TokenCounter}.
 *
 * @stable
 */
export const HEURISTIC_TOKEN_COUNTER: ContextTokenCounter = Object.freeze({
  id: 'graphorin/heuristic@chars-per-4+dense-script',
  async countText(text: string): Promise<number> {
    if (typeof text !== 'string' || text.length === 0) return 0;
    const dense = text.match(DENSE_SCRIPT_RE)?.length ?? 0;
    const latin = text.length - dense;
    return Math.ceil(latin / 4) + dense;
  },
});

/**
 * Wrap a real {@link TokenCounter} into the narrower
 * {@link ContextTokenCounter} surface. Calls `countText(text)`
 * directly for max precision; falls back to the synthetic
 * single-message bridge when only `count(messages)` is supported.
 *
 * @stable
 */
export function adaptTokenCounter(counter: TokenCounter): ContextTokenCounter {
  return Object.freeze({
    id: counter.id,
    async countText(text: string): Promise<number> {
      if (typeof text !== 'string' || text.length === 0) return 0;
      return counter.countText(text);
    },
  });
}

/**
 * Count tokens across a message list using a {@link TokenCounter}
 * (or the heuristic fallback). Used by the trigger-evaluation hot
 * path of the auto-compaction subsystem (RB-46) at the top of every
 * step.
 *
 * @stable
 */
export async function countMessageTokens(
  messages: ReadonlyArray<Message>,
  counter: TokenCounter | ContextTokenCounter,
): Promise<number> {
  if ('count' in counter && typeof (counter as TokenCounter).count === 'function') {
    return (counter as TokenCounter).count(messages);
  }
  let total = 0;
  for (const message of messages) {
    total += await counter.countText(renderMessageText(message));
  }
  return total;
}

/**
 * Render a `Message` into a single textual approximation suitable
 * for token counting. Multimodal parts other than `'text'` /
 * `'reasoning'` contribute a constant approximation so the counter
 * does not silently under-count.
 *
 * @stable
 */
export function renderMessageText(message: Message): string {
  if (message.role === 'system') return message.content;
  const content = message.content;
  if (typeof content === 'string') return content;
  let out = '';
  for (const part of content) {
    if (part.type === 'text' || part.type === 'reasoning') {
      out += `${part.text}\n`;
    } else {
      // Approximate non-text parts (image / audio / file) as a small
      // fixed cost so the counter does not silently under-count.
      out += '[non-text-part]\n';
    }
  }
  return out;
}
