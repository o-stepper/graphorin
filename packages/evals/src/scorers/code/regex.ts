/**
 * `regexMatch` - passes when the (stringified) `output` matches a
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
  // EB-5: a caller-supplied `/g` or `/y` RegExp makes `.test()` STATEFUL - it
  // advances `lastIndex`, so reusing the scorer across cases (or iterations)
  // would skip or drop matches non-deterministically. Match against a clone
  // with the stateful flags stripped (other flags - i/m/s/u - preserved); a
  // whole-string `.test()` never needs `g`/`y`. Built once; never mutated.
  const matcher =
    options.pattern.global || options.pattern.sticky
      ? new RegExp(options.pattern.source, options.pattern.flags.replace(/[gy]/g, ''))
      : options.pattern;
  return {
    name,
    async score({ output }) {
      const text = stringify(output);
      const pass = matcher.test(text);
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
