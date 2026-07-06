import type { MemoryStore } from '@graphorin/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  GraphMemoryStoreExt,
  MemoryStoreAdapter,
  ProceduralMemoryStoreExt,
} from '../src/index.js';

describe('W-048 MemoryStore baseline contract', () => {
  it('a core-only MemoryStore is a valid MemoryStoreAdapter (graceful degradation)', () => {
    // THE degradation gate: every Ext addition over the six core tier
    // namespaces must be optional, or a third-party adapter written
    // against core `MemoryStore` alone stops compiling. Adding a
    // REQUIRED member to any *MemoryStoreExt breaks this line.
    expectTypeOf<MemoryStore>().toExtend<MemoryStoreAdapter>();
  });

  it('the graph and procedural Ext contracts are importable from the package root', () => {
    // Import-surface smoke: these two used to be package-internal only.
    expectTypeOf<GraphMemoryStoreExt['expandOneHop']>().toBeFunction();
    expectTypeOf<ProceduralMemoryStoreExt>().toExtend<MemoryStoreAdapter['procedural']>();
    expect(true).toBe(true);
  });
});
