/**
 * Wave-D D5 (MST-12) - the migration runner's PERSISTED cursor: a
 * killed / aborted `auto-migrate` resumes from the `migration_state`
 * cursor on the next invocation instead of re-embedding from scratch.
 */

import { describe, expect, it } from 'vitest';

import type {
  MigrateEmbedderOptions,
  MigrationStateStoreLike,
} from '../src/migration/embedder-migration.js';
import { migrateEmbedder } from '../src/migration/embedder-migration.js';
import { createStubEmbedder, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

/** Minimal in-memory MigrationStateStoreLike (mirrors the sqlite repo). */
function memoryStateStore(): MigrationStateStoreLike & {
  rows: Map<
    string,
    {
      id: string;
      sourceEmbedder: string;
      targetEmbedder: string;
      status: string;
      processed: number;
      lastRecordId: string | null;
    }
  >;
} {
  const rows = new Map<
    string,
    {
      id: string;
      sourceEmbedder: string;
      targetEmbedder: string;
      status: string;
      processed: number;
      lastRecordId: string | null;
    }
  >();
  return {
    rows,
    async findResumable(source, target) {
      for (const row of rows.values()) {
        if (
          row.sourceEmbedder === source &&
          row.targetEmbedder === target &&
          (row.status === 'running' || row.status === 'aborted')
        ) {
          return { id: row.id, processed: row.processed, lastRecordId: row.lastRecordId };
        }
      }
      return null;
    },
    async create(state) {
      rows.set(state.id, {
        id: state.id,
        sourceEmbedder: state.sourceEmbedder,
        targetEmbedder: state.targetEmbedder,
        status: 'running',
        processed: 0,
        lastRecordId: null,
      });
    },
    async update(id, patch) {
      const row = rows.get(id);
      if (row === undefined) return;
      if (patch.processed !== undefined) row.processed = patch.processed;
      if (patch.lastRecordId !== undefined) row.lastRecordId = patch.lastRecordId;
      if (patch.status !== undefined) row.status = patch.status;
    },
  };
}

describe('migrateEmbedder + persisted state (MST-12)', () => {
  it('an aborted run resumes from the persisted cursor - no re-embedding of finished batches', async () => {
    const source = createStubEmbedder({ id: 'stub:src@8' });
    const target = createStubEmbedder({ id: 'stub:tgt@8' });
    const embeddings = new InMemoryEmbeddingRegistry();
    embeddings.registerOrReturn({
      id: source.id(),
      embedderKind: 'stub',
      model: 'src',
      dim: 8,
      configHash: source.configHash(),
    });

    const facts = ['f1', 'f2', 'f3', 'f4'].map((id) => ({ id, text: `text ${id}` }));
    const written: string[] = [];
    const batchRequests: Array<{ kind: string; cursor: string | null }> = [];
    const nextBatch: NonNullable<MigrateEmbedderOptions['nextBatch']> = async ({
      kind,
      batchSize,
      cursor,
    }) => {
      batchRequests.push({ kind, cursor });
      if (kind !== 'fact') return { rows: [], nextCursor: null };
      const start = cursor === null ? 0 : facts.findIndex((f) => f.id === cursor) + 1;
      const slice = facts.slice(start, start + batchSize);
      const last = slice[slice.length - 1];
      return {
        rows: slice.map((f) => ({
          id: f.id,
          text: f.text,
          write: async () => {
            written.push(f.id);
          },
        })),
        nextCursor: start + batchSize >= facts.length ? null : (last?.id ?? null),
      };
    };

    const state = memoryStateStore();
    const abort = new AbortController();
    const firstRun = migrateEmbedder({
      source,
      target,
      embeddings,
      strategy: 'auto-migrate',
      batchSize: 2,
      nextBatch,
      state,
      signal: abort.signal,
    });
    // Consume ONE batch, then "kill" the run.
    const first = await firstRun.next();
    expect(first.value?.phase).toBe('running');
    expect(written).toEqual(['f1', 'f2']);
    abort.abort();
    await expect(async () => {
      for await (const _event of firstRun) {
        // drain to the abort
      }
    }).rejects.toThrow(/aborted/);
    const persisted = [...state.rows.values()][0];
    expect(persisted?.status).toBe('aborted');
    expect(persisted?.lastRecordId).toBe('fact:f2');
    expect(persisted?.processed).toBe(2);

    // Second invocation (fresh process semantics): resumes at f3.
    const events: string[] = [];
    for await (const event of migrateEmbedder({
      source,
      target,
      embeddings,
      strategy: 'auto-migrate',
      batchSize: 2,
      nextBatch,
      state,
    })) {
      events.push(event.phase);
    }
    expect(written).toEqual(['f1', 'f2', 'f3', 'f4']); // nothing re-embedded
    expect(events[events.length - 1]).toBe('committed');
    expect(persisted?.status).toBe('committed');
    expect(persisted?.processed).toBe(4);
    // The resumed run's very first fact request used the persisted cursor.
    const resumedFactRequests = batchRequests.filter((r) => r.kind === 'fact').slice(1);
    expect(resumedFactRequests[0]?.cursor).toBe('f2');
    // Source retired on commit.
    const sourceMeta = embeddings.get(source.id()) as { retiredAt?: number | null } | null;
    expect(sourceMeta?.retiredAt).not.toBeNull();
  });

  it('a committed pair does not resume - a fresh migration id is created', async () => {
    const source = createStubEmbedder({ id: 'stub:src@8' });
    const target = createStubEmbedder({ id: 'stub:tgt@8' });
    const embeddings = new InMemoryEmbeddingRegistry();
    embeddings.registerOrReturn({
      id: source.id(),
      embedderKind: 'stub',
      model: 'src',
      dim: 8,
      configHash: source.configHash(),
    });
    const state = memoryStateStore();
    const nextBatch: NonNullable<MigrateEmbedderOptions['nextBatch']> = async () => ({
      rows: [],
      nextCursor: null,
    });
    for await (const _e of migrateEmbedder({
      source,
      target,
      embeddings,
      strategy: 'auto-migrate',
      nextBatch,
      state,
    })) {
      // drain
    }
    expect([...state.rows.values()][0]?.status).toBe('committed');
    expect(state.rows.size).toBe(1);
  });
});
