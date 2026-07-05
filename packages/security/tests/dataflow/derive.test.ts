import type { ToolTrustClass } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { deriveTaintLabel, isUntrustedTrustClass } from '../../src/dataflow/derive.js';

describe('W-101 - isUntrustedTrustClass agrees with deriveTaintLabel', () => {
  const ALL: ReadonlyArray<ToolTrustClass> = [
    'first-party-built-in',
    'first-party-user-defined',
    'skill-trusted',
    'skill-untrusted',
    'mcp-derived',
    'web-search',
  ];
  it('the two layers share one definition of "untrusted source"', () => {
    for (const trustClass of ALL) {
      const label = deriveTaintLabel({ trustClass });
      expect(isUntrustedTrustClass(trustClass)).toBe(label.untrusted);
    }
    // And the concrete taxonomy is what the docs promise.
    expect(ALL.filter(isUntrustedTrustClass)).toEqual([
      'skill-untrusted',
      'mcp-derived',
      'web-search',
    ]);
  });
});
