import { describe, expect, expectTypeOf, it } from 'vitest';

import type { CustomSpanType, KnownSpanType, SpanType } from '../src/index.js';

describe('SpanType open union (W-126)', () => {
  it('x.* custom kinds are valid SpanType values without casts', () => {
    const custom: SpanType = 'x.acme.rerank';
    expect(custom.startsWith('x.')).toBe(true);
    expectTypeOf<'x.acme.rerank'>().toExtend<SpanType>();
    expectTypeOf<'x.acme.rerank'>().toExtend<CustomSpanType>();
  });

  it('typos of known literals remain compile errors', () => {
    // @ts-expect-error - misspelled known literal is NOT a SpanType
    const typo: SpanType = 'memory.serch.semantic';
    void typo;
    expect(true).toBe(true);
  });

  it('the known and custom domains do not overlap', () => {
    expectTypeOf<KnownSpanType>().not.toExtend<CustomSpanType>();
    expectTypeOf<CustomSpanType>().not.toExtend<KnownSpanType>();
  });
});
