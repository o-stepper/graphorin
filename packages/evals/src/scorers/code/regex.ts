/**
 * `regexMatch` — passes when the (stringified) `output` matches a
 * caller-supplied regex.
 *
 * @packageDocumentation
 */

import type { Scorer } from '@graphorin/observability/eval';

/** @stable */
export interface RegexMatchOptions {
  readonly pattern: RegExp;
  /** Optional name override. Default `'regex-match'`. */
  readonly name?: string;
}

/** @stable */
export function regexMatch<I = unknown>(options: RegexMatchOptions): Scorer<I, unknown> {
  const name = options.name ?? 'regex-match';
  return {
    name,
    async score({ output }) {
      const text = stringify(output);
      const pass = options.pattern.test(text);
      if (pass) return { pass, score: 1 };
      return {
        pass,
        score: 0,
        reason: `output does not match ${options.pattern.toString()} (got ${truncate(text)}).`,
      };
    },
  };
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function truncate(s: string, max: number = 100): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
