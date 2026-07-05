import { describe, expect, expectTypeOf, it } from 'vitest';

import type { AnyTool, Tool } from '../src/index.js';

interface Deps {
  readonly db: string;
}

describe('AnyTool (W-100)', () => {
  it('a concretely-typed Tool is assignable to AnyTool (the collection seam)', () => {
    // The invariance that motivates AnyTool: needsApproval/idempotencyKey
    // are contravariant in TInput, so this does NOT hold for
    // Tool<unknown, unknown, Deps>.
    expectTypeOf<Tool<{ q: string }, number, Deps>>().toExtend<AnyTool<Deps>>();
    expectTypeOf<Tool<{ q: string }, number, Deps>>().not.toExtend<Tool<unknown, unknown, Deps>>();
    expect(true).toBe(true);
  });

  it('AnyTool keeps the full Tool surface (keyof parity)', () => {
    expectTypeOf<keyof AnyTool<Deps>>().toEqualTypeOf<keyof Tool<unknown, unknown, Deps>>();
  });
});
