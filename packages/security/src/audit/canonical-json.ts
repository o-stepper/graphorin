/**
 * Canonical JSON serializer used by the audit chain. The serializer
 * matches the framework's stability contract:
 *
 * - Object keys are sorted lexicographically (`String#localeCompare`
 *   with the `'en'` collator and a stable code-point fallback).
 * - Arrays preserve their input order.
 * - `undefined` values are dropped (not stringified to `null`); the
 *   helper rejects raw `undefined` at the top level.
 * - `NaN`, `Infinity`, `-Infinity` are rejected.
 * - `BigInt` is rejected - the audit log never stores big integers.
 * - Strings are emitted with the JSON-spec escape sequences.
 *
 * @packageDocumentation
 */

import { AuditPayloadSerializationError } from './errors.js';

/**
 * Serialise `value` into the framework's canonical JSON byte sequence.
 * The result is a UTF-8-safe string suitable for SHA-256 hashing.
 *
 * @stable
 */
export function canonicalJson(value: unknown): string {
  if (value === undefined) {
    throw new AuditPayloadSerializationError('top-level value is undefined');
  }
  return serialize(value, new WeakSet<object>());
}

const COLLATOR = new Intl.Collator('en', { sensitivity: 'variant' });

function serialize(value: unknown, seen: WeakSet<object>): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(value)) {
        throw new AuditPayloadSerializationError(`non-finite number ${String(value)}`);
      }
      return String(value);
    case 'string':
      return JSON.stringify(value);
    case 'bigint':
      throw new AuditPayloadSerializationError('BigInt is not supported');
    case 'function':
    case 'symbol':
      throw new AuditPayloadSerializationError(`cannot serialise ${typeof value}`);
  }
  if (typeof value === 'object') {
    if (seen.has(value as object)) {
      throw new AuditPayloadSerializationError('cyclic reference detected');
    }
    seen.add(value as object);
    try {
      if (Array.isArray(value)) {
        const parts: string[] = [];
        for (const entry of value) {
          parts.push(entry === undefined ? 'null' : serialize(entry, seen));
        }
        return `[${parts.join(',')}]`;
      }
      const entries: Array<[string, string]> = [];
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (v === undefined) continue;
        entries.push([k, serialize(v, seen)]);
      }
      entries.sort((a, b) => {
        const cmp = COLLATOR.compare(a[0], b[0]);
        if (cmp !== 0) return cmp;
        return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
      });
      return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${v}`).join(',')}}`;
    } finally {
      seen.delete(value as object);
    }
  }
  throw new AuditPayloadSerializationError(`unsupported type ${typeof value}`);
}
