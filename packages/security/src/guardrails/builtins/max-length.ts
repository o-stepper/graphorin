/**
 * `maxLength` — block when the string-coerced value exceeds the
 * configured character or token budget. Token counting is delegated
 * via an injectable `TokenCounter`-shaped callback so the guardrail
 * does not pull a tokenizer into the security package.
 *
 * Reference: the project's security architecture, § Guardrails + § Cost & rate limiting.
 * (resource limits — hard ceilings).
 *
 * @packageDocumentation
 */

import { defineInputGuardrail, defineOutputGuardrail } from '../builders.js';
import type {
  GuardrailDefinition,
  GuardrailResult,
  InputGuardrail,
  OutputGuardrail,
} from '../types.js';

/**
 * Options for `maxLength(...)`.
 *
 * @stable
 */
export interface MaxLengthOptions {
  /** Hard ceiling on `value.length` (string char count). */
  readonly chars?: number;
  /** Hard ceiling on the token count returned by `countTokens(...)`. */
  readonly tokens?: number;
  /** Token-counter callback used when `tokens` is set. */
  readonly countTokens?: (text: string) => number | Promise<number>;
  /** Override the action (defaults to `'block'`). */
  readonly action?: 'block' | 'warn';
  /** Stage the guardrail applies to. Defaults to `'input'`. */
  readonly stage?: 'input' | 'output';
  /** Override the guardrail's `name` (useful when registering more than one). */
  readonly name?: string;
}

/**
 * Construct a `maxLength` guardrail. Returns an input or output
 * variant depending on the `stage` option.
 *
 * @stable
 */
export function maxLength<TValue = unknown>(opts: MaxLengthOptions): GuardrailDefinition<TValue> {
  const stage = opts.stage ?? 'input';
  const action = opts.action ?? 'block';
  const name = opts.name ?? 'maxLength';

  const spec = {
    name,
    check: async (value: TValue): Promise<GuardrailResult<TValue>> => {
      const text = stringify(value);
      if (opts.chars !== undefined && text.length > opts.chars) {
        return {
          ok: false,
          action,
          message: `value exceeds chars budget (${text.length} > ${opts.chars})`,
          metadata: Object.freeze({ chars: text.length, limit: opts.chars }),
        };
      }
      if (opts.tokens !== undefined && opts.countTokens !== undefined) {
        const count = await opts.countTokens(text);
        if (count > opts.tokens) {
          return {
            ok: false,
            action,
            message: `value exceeds token budget (${count} > ${opts.tokens})`,
            metadata: Object.freeze({ tokens: count, limit: opts.tokens }),
          };
        }
      }
      return { ok: true };
    },
  };

  return stage === 'input'
    ? (defineInputGuardrail<TValue>(spec) as InputGuardrail<TValue>)
    : (defineOutputGuardrail<TValue>(spec) as OutputGuardrail<TValue>);
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(value);
  }
}
