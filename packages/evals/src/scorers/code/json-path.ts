/**
 * `jsonPath` — passes when the value at a JSON-pointer-shaped path
 * deep-equals the caller-supplied target. Supports the dot-notation
 * subset (`a.b.c`) and array indices (`a.0.name`).
 *
 * @packageDocumentation
 */

import type { Scorer } from '@graphorin/observability/eval';

/** @stable */
export interface JsonPathOptions {
  /** Dot-separated path (`'data.user.id'`). */
  readonly path: string;
  /** Expected value. Compared by deep-equality. */
  readonly equals: unknown;
  /** Optional name override. */
  readonly name?: string;
}

/** @stable */
export function jsonPath<I = unknown>(options: JsonPathOptions): Scorer<I, unknown> {
  const name = options.name ?? `json-path:${options.path}`;
  return {
    name,
    async score({ output }) {
      const actual = readPath(output, options.path);
      const pass = deepEqual(actual, options.equals);
      if (pass) return { pass, score: 1 };
      return {
        pass,
        score: 0,
        reason:
          `at '${options.path}' expected ${truncate(stringifySafe(options.equals))}, ` +
          `received ${truncate(stringifySafe(actual))}.`,
      };
    },
  };
}

function readPath(root: unknown, path: string): unknown {
  if (path.length === 0) return root;
  const segments = path.split('.');
  let cursor: unknown = root;
  for (const segment of segments) {
    if (cursor === null || cursor === undefined) return undefined;
    if (Array.isArray(cursor)) {
      const idx = Number.parseInt(segment, 10);
      if (!Number.isFinite(idx)) return undefined;
      cursor = cursor[idx];
    } else if (typeof cursor === 'object') {
      cursor = (cursor as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return cursor;
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

function stringifySafe(value: unknown): string {
  if (value === undefined) return 'undefined';
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
