import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { createSqliteStore, EmbedderLockOnFirstError } from '../src/index.js';

/**
 * Item 10 step 1 - the write-path contextualization mode joins the
 * index version key. Switching `contextualRetrieval` must invalidate
 * the index like a model change; legacy rows (registered before the
 * `index_mode` column existed) adopt the caller's mode once instead of
 * failing existing databases retroactively.
 */
async function setup(): Promise<{
  embeddings: Awaited<ReturnType<typeof createSqliteStore>>['embeddings'];
  close: () => Promise<void>;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-idxmode-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  return { embeddings: store.embeddings, close: () => store.close() };
}

const BASE = {
  id: 'stub:e5@4',
  embedderKind: 'stub',
  model: 'e5',
  dim: 4,
  distanceMetric: 'cosine' as const,
  configHash: 'h1',
};

describe('embedding_meta index_mode (item 10 step 1)', () => {
  it('persists the mode on first registration and round-trips it', async () => {
    const { embeddings, close } = await setup();
    const row = embeddings.registerOrReturn({ ...BASE, indexMode: 'late-chunk' });
    expect(row.indexMode).toBe('late-chunk');
    // Idempotent re-register with the same mode returns the row.
    const again = embeddings.registerOrReturn({ ...BASE, indexMode: 'late-chunk' });
    expect(again.indexMode).toBe('late-chunk');
    await close();
  });

  it('a legacy row (no mode) adopts the current mode once, then enforces it', async () => {
    const { embeddings, close } = await setup();
    // Legacy caller: no indexMode recorded.
    const legacy = embeddings.registerOrReturn({ ...BASE });
    expect(legacy.indexMode).toBeNull();
    // Post-upgrade caller adopts the current mode without failing.
    const adopted = embeddings.registerOrReturn({ ...BASE, indexMode: 'late-chunk' });
    expect(adopted.indexMode).toBe('late-chunk');
    // From here on a switch is an incompatibility.
    expect(() => embeddings.registerOrReturn({ ...BASE, indexMode: 'off' })).toThrow(
      EmbedderLockOnFirstError,
    );
    expect(() => embeddings.registerOrReturn({ ...BASE, indexMode: 'off' })).toThrow(
      /contextualization mode 'late-chunk'/,
    );
    await close();
  });

  it('a mode switch on a recorded row fails like a configHash change', async () => {
    const { embeddings, close } = await setup();
    embeddings.registerOrReturn({ ...BASE, indexMode: 'late-chunk' });
    expect(() => embeddings.registerOrReturn({ ...BASE, indexMode: 'late-chunk+llm' })).toThrow(
      EmbedderLockOnFirstError,
    );
    await close();
  });

  it('a caller omitting indexMode never trips the mode check (legacy compatibility)', async () => {
    const { embeddings, close } = await setup();
    embeddings.registerOrReturn({ ...BASE, indexMode: 'late-chunk' });
    // Legacy callers keep working against a mode-recorded row.
    const row = embeddings.registerOrReturn({ ...BASE });
    expect(row.indexMode).toBe('late-chunk');
    await close();
  });
});
