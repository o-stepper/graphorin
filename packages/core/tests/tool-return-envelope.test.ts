/**
 * Branch coverage for the ToolReturn envelope helpers in
 * `contracts/tool.ts`: the branded factory, the one guard (brand first,
 * narrow structural fallback), and the unbranded-envelope observability
 * predicate.
 */
import { describe, expect, it } from 'vitest';

import {
  isToolReturnEnvelope,
  isUnbrandedToolReturn,
  TOOL_RETURN_BRAND,
  toolReturn,
} from '../src/contracts/tool.js';

describe('toolReturn factory', () => {
  it('brands the envelope and keeps only supplied optional fields', () => {
    const bare = toolReturn({ output: 42 });
    expect((bare as unknown as Record<PropertyKey, unknown>)[TOOL_RETURN_BRAND]).toBe(true);
    expect(Object.keys(bare)).toEqual(['output']);

    const full = toolReturn({
      output: 'ok',
      contentParts: [{ type: 'text', text: 'hi' }],
      taint: { untrusted: true },
    });
    expect(full.contentParts).toHaveLength(1);
    expect(full.taint).toEqual({ untrusted: true });
  });
});

describe('isToolReturnEnvelope', () => {
  it('rejects primitives, null, and arrays', () => {
    expect(isToolReturnEnvelope('output')).toBe(false);
    expect(isToolReturnEnvelope(null)).toBe(false);
    expect(isToolReturnEnvelope([{ output: 1 }])).toBe(false);
  });

  it('accepts any branded object regardless of extra keys', () => {
    const branded = { [TOOL_RETURN_BRAND]: true, output: 1, exitCode: 0 };
    expect(isToolReturnEnvelope(branded)).toBe(true);
  });

  it('rejects unbranded objects without an own output key', () => {
    expect(isToolReturnEnvelope({ contentParts: [] })).toBe(false);
  });

  it('accepts the narrow structural shape and rejects foreign keys', () => {
    expect(isToolReturnEnvelope({ output: 1 })).toBe(true);
    expect(isToolReturnEnvelope({ output: 1, contentParts: [], taint: {} })).toBe(true);
    // `{ output, exitCode }` style process results must pass through intact.
    expect(isToolReturnEnvelope({ output: 'x', exitCode: 0 })).toBe(false);
  });
});

describe('isUnbrandedToolReturn', () => {
  it('flags only structurally-matched envelopes without the brand', () => {
    expect(isUnbrandedToolReturn({ output: 1 })).toBe(true);
    expect(isUnbrandedToolReturn(toolReturn({ output: 1 }))).toBe(false);
    expect(isUnbrandedToolReturn({ output: 1, exitCode: 0 })).toBe(false);
  });
});
