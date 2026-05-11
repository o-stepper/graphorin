import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { validate, validateOrThrow } from '../src/utils/validation.js';

describe('validate', () => {
  it('returns ok for valid input', () => {
    const schema = z.object({ name: z.string() });
    expect(validate(schema, { name: 'graphorin' })).toEqual({
      ok: true,
      value: { name: 'graphorin' },
    });
  });

  it('returns the error result for invalid input', () => {
    const schema = z.object({ name: z.string() });
    const r = validate(schema, { name: 5 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe('validateOrThrow', () => {
  it('returns the parsed value on success', () => {
    const schema = z.object({ n: z.number() });
    expect(validateOrThrow(schema, { n: 1 })).toEqual({ n: 1 });
  });

  it('throws a TypeError carrying every issue', () => {
    const schema = z.object({ a: z.string(), b: z.number() });
    expect(() => validateOrThrow(schema, { a: 1, b: 'oops' }, 'config')).toThrow(
      /validation failed for config/,
    );
  });
});
