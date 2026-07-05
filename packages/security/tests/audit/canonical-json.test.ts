import { describe, expect, it } from 'vitest';

import { canonicalJson } from '../../src/audit/canonical-json.js';
import { AuditPayloadSerializationError } from '../../src/audit/errors.js';

describe('@graphorin/security/audit - canonical JSON', () => {
  it('sorts object keys lexicographically', () => {
    expect(canonicalJson({ b: 1, a: 2, c: 3 })).toBe('{"a":2,"b":1,"c":3}');
  });

  it('preserves array order', () => {
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
  });

  it('drops undefined fields silently', () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
  });

  it('emits null and booleans without quotes', () => {
    expect(canonicalJson({ a: null, b: true, c: false })).toBe('{"a":null,"b":true,"c":false}');
  });

  it('rejects top-level undefined', () => {
    expect(() => canonicalJson(undefined)).toThrowError(AuditPayloadSerializationError);
  });

  it('rejects NaN / Infinity', () => {
    expect(() => canonicalJson(Number.NaN)).toThrow();
    expect(() => canonicalJson(Number.POSITIVE_INFINITY)).toThrow();
  });

  it('rejects BigInt', () => {
    expect(() => canonicalJson(1n)).toThrow();
  });

  it('rejects functions and symbols', () => {
    expect(() => canonicalJson(() => 1)).toThrow();
    expect(() => canonicalJson(Symbol('s'))).toThrow();
  });

  it('rejects cyclic references', () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(() => canonicalJson(obj)).toThrow();
  });

  it('serialises nested structures deterministically', () => {
    const a = canonicalJson({ list: [{ a: 1, b: 2 }, { c: 3 }] });
    const b = canonicalJson({ list: [{ b: 2, a: 1 }, { c: 3 }] });
    expect(a).toBe(b);
  });

  it('escapes special characters per JSON spec', () => {
    expect(canonicalJson('hello\n"\\world')).toBe('"hello\\n\\"\\\\world"');
  });
});
