/**
 * `exactMatch` — passes when `output` deeply equals `case.expected`.
 * Useful for deterministic outputs (numeric / parsed JSON / classifier
 * label).
 *
 * @packageDocumentation
 */

import type { Scorer } from '@graphorin/observability/eval';

/** @stable */
export interface ExactMatchOptions {
  /** Optional name override. Default `'exact-match'`. */
  readonly name?: string;
  /** When `true`, treat strings case-insensitively. Default `false`. */
  readonly caseInsensitive?: boolean;
  /** When `true`, trim whitespace before comparing strings. Default `false`. */
  readonly trim?: boolean;
}

/**
 * Build an exact-match scorer.
 *
 * @stable
 */
export function exactMatch<I = unknown, O = unknown>(
  options: ExactMatchOptions = {},
): Scorer<I, O> {
  const name = options.name ?? 'exact-match';
  return {
    name,
    async score({ case: c, output }) {
      const expected = c.expected;
      if (expected === undefined) {
        return {
          pass: false,
          reason: 'exactMatch requires a `case.expected` value.',
        };
      }
      const a = normalize(output, options);
      const b = normalize(expected, options);
      const pass = deepEqual(a, b);
      if (pass) return { pass, score: 1 };
      return {
        pass,
        score: 0,
        reason: `expected ${truncate(JSON.stringify(b))}, received ${truncate(JSON.stringify(a))}`,
      };
    },
  };
}

function normalize(value: unknown, opts: ExactMatchOptions): unknown {
  if (typeof value === 'string') {
    let v = value;
    if (opts.trim === true) v = v.trim();
    if (opts.caseInsensitive === true) v = v.toLowerCase();
    return v;
  }
  return value;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as Record<string, unknown>).sort();
    const bKeys = Object.keys(b as Record<string, unknown>).sort();
    if (aKeys.length !== bKeys.length) return false;
    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i]) return false;
      if (
        !deepEqual(
          (a as Record<string, unknown>)[aKeys[i] as string],
          (b as Record<string, unknown>)[bKeys[i] as string],
        )
      )
        return false;
    }
    return true;
  }
  return false;
}

function truncate(s: string, max: number = 80): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
