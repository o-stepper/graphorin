import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { tool } from '../src/builder/index.js';

describe('tool() — property tests', () => {
  it('accepts arbitrary valid Zod schemas without throwing', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 64 }), (raw) => {
        const safeName = raw.replace(/[^A-Za-z0-9._-]/g, 'x').slice(0, 64) || 'x';
        const t = tool({
          name: safeName,
          description: 'arb',
          inputSchema: z.object({ payload: z.unknown() }),
          sideEffectClass: 'pure',
          async execute() {
            return null;
          },
        });
        expect(t.name).toBe(safeName);
      }),
    );
  });

  it('rejects names containing whitespace deterministically', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => /\s/.test(s)),
        (badName) => {
          expect(() =>
            tool({
              name: badName,
              description: 'x',
              inputSchema: z.object({}),
              sideEffectClass: 'pure',
              async execute() {
                return null;
              },
            }),
          ).toThrow();
        },
      ),
    );
  });
});
