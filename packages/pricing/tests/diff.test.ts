import { describe, expect, it } from 'vitest';
import type { ModelPrice, PricingSnapshot } from '../src/index.js';
import { BUNDLED_SNAPSHOT, computeEntriesDigest, diffPricing } from '../src/index.js';

describe('@graphorin/pricing - diffPricing', () => {
  it('returns an empty array for identical snapshots', () => {
    expect(diffPricing(BUNDLED_SNAPSHOT, BUNDLED_SNAPSHOT)).toEqual([]);
  });

  it('reports added and removed entries', () => {
    const newEntry: ModelPrice = {
      provider: 'anthropic',
      model: 'claude-future',
      inputUsdPerToken: 1 / 1_000_000,
      outputUsdPerToken: 5 / 1_000_000,
    };
    // `before` keeps every bundled entry; `after` swaps the last
    // bundled entry for `newEntry` so the diff produces both an
    // `added` row (newEntry) and a `removed` row (the trimmed entry).
    const before = withEntries(BUNDLED_SNAPSHOT.entries);
    const after = withEntries([...BUNDLED_SNAPSHOT.entries.slice(0, -1), newEntry]);
    const result = diffPricing(before, after);
    const added = result.filter((r) => r.kind === 'added');
    const removed = result.filter((r) => r.kind === 'removed');
    expect(added).toHaveLength(1);
    expect(removed).toHaveLength(1);
    expect(added[0]?.after?.model).toBe('claude-future');
  });

  it('reports changed fields when prices differ', () => {
    const updated: ReadonlyArray<ModelPrice> = BUNDLED_SNAPSHOT.entries.map((entry) =>
      entry.provider === 'openai' && entry.model === 'gpt-4o-2024-11-20'
        ? { ...entry, outputUsdPerToken: entry.outputUsdPerToken * 1.1 }
        : entry,
    );
    const result = diffPricing(BUNDLED_SNAPSHOT, withEntries(updated));
    const changed = result.find(
      (r) => r.kind === 'changed' && r.provider === 'openai' && r.model === 'gpt-4o-2024-11-20',
    );
    expect(changed).toBeDefined();
    expect(changed?.changedFields).toContain('outputUsdPerToken');
  });

  it('sorts the result deterministically', () => {
    const a = diffPricing(BUNDLED_SNAPSHOT, BUNDLED_SNAPSHOT);
    const b = diffPricing(BUNDLED_SNAPSHOT, BUNDLED_SNAPSHOT);
    expect(a).toEqual(b);
  });
});

function withEntries(entries: ReadonlyArray<ModelPrice>): PricingSnapshot {
  return {
    version: BUNDLED_SNAPSHOT.version,
    source: BUNDLED_SNAPSHOT.source,
    snapshotDate: BUNDLED_SNAPSHOT.snapshotDate,
    currency: 'USD',
    sha256: computeEntriesDigest(entries),
    entries,
  };
}
