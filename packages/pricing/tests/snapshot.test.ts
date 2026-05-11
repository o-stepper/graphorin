import { describe, expect, it } from 'vitest';

import { BUNDLED_SNAPSHOT, computeEntriesDigest, SNAPSHOT_DATE } from '../src/index.js';

describe('@graphorin/pricing — bundled snapshot', () => {
  it('declares provenance metadata', () => {
    expect(BUNDLED_SNAPSHOT.version).toBe('graphorin/0.1');
    expect(BUNDLED_SNAPSHOT.snapshotDate).toBe(SNAPSHOT_DATE);
    expect(BUNDLED_SNAPSHOT.currency).toBe('USD');
    expect(BUNDLED_SNAPSHOT.source).toMatch(/^https?:\/\//);
    expect(BUNDLED_SNAPSHOT.source).toContain('graphorin');
  });

  it('SHA-256 digest matches the canonical entries serialisation', () => {
    expect(BUNDLED_SNAPSHOT.sha256).toBe(computeEntriesDigest(BUNDLED_SNAPSHOT.entries));
    expect(BUNDLED_SNAPSHOT.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('snapshot is frozen', () => {
    expect(Object.isFrozen(BUNDLED_SNAPSHOT)).toBe(true);
  });

  it('every entry has positive prices', () => {
    for (const entry of BUNDLED_SNAPSHOT.entries) {
      expect(entry.inputUsdPerToken).toBeGreaterThanOrEqual(0);
      expect(entry.outputUsdPerToken).toBeGreaterThanOrEqual(0);
    }
  });

  it('covers the canonical provider catalogue', () => {
    const providers = new Set(BUNDLED_SNAPSHOT.entries.map((e) => e.provider));
    expect(providers).toContain('anthropic');
    expect(providers).toContain('openai');
    expect(providers).toContain('google');
    expect(providers).toContain('mistral');
    expect(providers).toContain('cohere');
    expect(providers).toContain('ollama');
    expect(providers).toContain('graphorin-llamacpp');
  });
});
