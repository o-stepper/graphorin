import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';

import type { ZodLikeError, ZodLikeSchema } from '../src/utils/validation.js';
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

describe('W-013 - zod 4 compatibility surface', () => {
  it('validateOrThrow does not crash on symbol path elements (zod 4 PropertyKey paths)', () => {
    const sym = Symbol('sym-key');
    const schema: ZodLikeSchema<never> = {
      safeParse: () => ({
        success: false as const,
        error: {
          name: 'ZodError',
          message: 'nope',
          issues: [
            { path: ['user', sym, 0], message: 'bad symbol field' },
            { path: [], message: 'root issue' },
          ],
        },
      }),
    } as unknown as ZodLikeSchema<never>;
    expect(() => validateOrThrow(schema, {}, 'test')).toThrowError(
      /Symbol\(sym-key\).*bad symbol field|bad symbol field/,
    );
  });

  it('zod3-like and zod4-like issue shapes are both assignable to ZodLikeError', () => {
    // Structural fixtures - the shim must be a SUPERSET of both peers.
    type Zod3Issue = { path: Array<string | number>; message: string };
    type Zod4Issue = { path: PropertyKey[]; message: string };
    type ShimIssue = ZodLikeError['issues'][number];
    expectTypeOf<Zod3Issue>().toExtend<ShimIssue>();
    expectTypeOf<Zod4Issue>().toExtend<ShimIssue>();
  });
});
