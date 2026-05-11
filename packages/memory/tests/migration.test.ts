import { describe, expect, it } from 'vitest';
import {
  EmbedderMigrationAbortedError,
  EmbedderMigrationLockedError,
  EmbedderMigrationStateError,
  migrateEmbedder,
} from '../src/index.js';
import { createStubEmbedder, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

describe('@graphorin/memory/migration — migrateEmbedder', () => {
  it('lock-on-first refuses silent embedder swap', async () => {
    const registry = new InMemoryEmbeddingRegistry();
    const source = createStubEmbedder({ id: 'stub:src@8' });
    registry.registerOrReturn({
      id: source.id(),
      embedderKind: 'stub',
      model: 'src',
      dim: 8,
      configHash: source.configHash(),
    });
    const target = createStubEmbedder({ id: 'stub:tgt@8' });
    const stream = migrateEmbedder({
      source,
      target,
      embeddings: registry,
      strategy: 'lock-on-first',
    });
    await expect(stream.next()).rejects.toThrow(EmbedderMigrationLockedError);
  });

  it('multi-active registers the target alongside the source', async () => {
    const registry = new InMemoryEmbeddingRegistry();
    const source = createStubEmbedder({ id: 'stub:src@8' });
    registry.registerOrReturn({
      id: source.id(),
      embedderKind: 'stub',
      model: 'src',
      dim: 8,
      configHash: source.configHash(),
    });
    const target = createStubEmbedder({ id: 'stub:tgt@8' });
    const events = [];
    for await (const event of migrateEmbedder({
      source,
      target,
      embeddings: registry,
      strategy: 'multi-active',
    })) {
      events.push(event);
    }
    expect(events.length).toBe(1);
    expect(events[0]?.phase).toBe('committed');
    expect(registry.listActive().some((r) => r.id === 'stub:tgt@8')).toBe(true);
  });

  it('auto-migrate streams batches via the supplied nextBatch hook', async () => {
    const registry = new InMemoryEmbeddingRegistry();
    const source = createStubEmbedder({ id: 'stub:src@8' });
    registry.registerOrReturn({
      id: source.id(),
      embedderKind: 'stub',
      model: 'src',
      dim: 8,
      configHash: source.configHash(),
    });
    const target = createStubEmbedder({ id: 'stub:tgt@8' });
    const writes: Array<{ id: string; vector: Float32Array }> = [];
    const queues = new Map<string, Array<{ id: string; text: string }>>([
      [
        'fact',
        [
          { id: 'f1', text: 'one' },
          { id: 'f2', text: 'two' },
        ],
      ],
      ['episode', []],
      ['message', []],
    ]);
    const events = [];
    for await (const event of migrateEmbedder({
      source,
      target,
      embeddings: registry,
      strategy: 'auto-migrate',
      batchSize: 1,
      async nextBatch({ kind }) {
        const queue = queues.get(kind) ?? [];
        const next = queue.shift();
        if (next === undefined) return { rows: [], nextCursor: null };
        return {
          rows: [
            {
              id: next.id,
              text: next.text,
              async write(vector) {
                writes.push({ id: next.id, vector });
              },
            },
          ],
          nextCursor: queue.length > 0 ? `cursor_${queue.length}` : null,
        };
      },
    })) {
      events.push(event);
    }
    expect(writes.length).toBe(2);
    expect(events[events.length - 1]?.phase).toBe('committed');
    expect(registry.listActive().some((r) => r.id === 'stub:src@8')).toBe(false);
  });

  it('auto-migrate honours AbortSignal mid-stream', async () => {
    const registry = new InMemoryEmbeddingRegistry();
    const source = createStubEmbedder({ id: 'stub:src@8' });
    registry.registerOrReturn({
      id: source.id(),
      embedderKind: 'stub',
      model: 'src',
      dim: 8,
      configHash: source.configHash(),
    });
    const target = createStubEmbedder({ id: 'stub:tgt@8' });
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(
      (async () => {
        for await (const _ of migrateEmbedder({
          source,
          target,
          embeddings: registry,
          strategy: 'auto-migrate',
          signal: ctrl.signal,
          async nextBatch() {
            return {
              rows: [
                {
                  id: 'f1',
                  text: 'one',
                  async write() {},
                },
              ],
              nextCursor: null,
            };
          },
        })) {
          void _;
        }
      })(),
    ).rejects.toThrow(EmbedderMigrationAbortedError);
  });

  it('auto-migrate without nextBatch raises an actionable error', async () => {
    const registry = new InMemoryEmbeddingRegistry();
    const source = createStubEmbedder({ id: 'stub:src@8' });
    registry.registerOrReturn({
      id: source.id(),
      embedderKind: 'stub',
      model: 'src',
      dim: 8,
      configHash: source.configHash(),
    });
    const target = createStubEmbedder({ id: 'stub:tgt@8' });
    await expect(
      (async () => {
        for await (const _ of migrateEmbedder({
          source,
          target,
          embeddings: registry,
          strategy: 'auto-migrate',
        })) {
          void _;
        }
      })(),
    ).rejects.toThrow(EmbedderMigrationStateError);
  });

  it('source and target id collisions surface a state error', async () => {
    const registry = new InMemoryEmbeddingRegistry();
    const source = createStubEmbedder({ id: 'stub:same@8' });
    registry.registerOrReturn({
      id: source.id(),
      embedderKind: 'stub',
      model: 'same',
      dim: 8,
      configHash: source.configHash(),
    });
    const target = createStubEmbedder({ id: 'stub:same@8' });
    const stream = migrateEmbedder({
      source,
      target,
      embeddings: registry,
      strategy: 'multi-active',
    });
    await expect(stream.next()).rejects.toThrow(EmbedderMigrationStateError);
  });
});
