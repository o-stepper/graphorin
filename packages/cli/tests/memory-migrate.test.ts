/**
 * Wave-D D5 (N-2) - `graphorin memory migrate` is real: loads the
 * operator's --embedders factory module, drives the runner with the
 * store-side pager + persisted cursor, and reclaims retired vector
 * tables with --reclaim.
 */

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Fact } from '@graphorin/core';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';

import { runMemoryMigrate } from '../src/commands/memory.js';

const DIM = 4;

/** Deterministic offline embedder module, written as a real .mjs file. */
const EMBEDDERS_MODULE = `
function makeEmbedder(id) {
  return {
    id: () => id,
    dim: () => ${DIM},
    configHash: () => 'cfg-' + id,
    async embed(texts) {
      return texts.map((text) => {
        const v = new Float32Array(${DIM});
        for (let i = 0; i < text.length; i++) v[i % ${DIM}] += text.charCodeAt(i) / 255;
        return v;
      });
    },
  };
}
export const embedders = {
  'stub:src@${DIM}': () => makeEmbedder('stub:src@${DIM}'),
  'stub:tgt@${DIM}': () => makeEmbedder('stub:tgt@${DIM}'),
};
`;

async function seededSetup(): Promise<{ cfg: string; dbPath: string; modulePath: string }> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-migrate-'));
  const dbPath = join(dir, 'data.db');
  const cfg = join(dir, 'graphorin.config.json');
  const modulePath = join(dir, 'embedders.mjs');
  await writeFile(
    cfg,
    JSON.stringify({ storage: { path: dbPath, mode: 'lib' }, auth: { kind: 'none' } }),
    'utf8',
  );
  await writeFile(modulePath, EMBEDDERS_MODULE, 'utf8');
  const store = await createSqliteStore({ path: dbPath, mode: 'lib' });
  await store.init();
  store.embeddings.registerOrReturn({
    id: `stub:src@${DIM}`,
    embedderKind: 'stub',
    model: 'src',
    dim: DIM,
    configHash: `cfg-stub:src@${DIM}`,
  });
  const semantic = store.memory.semantic as unknown as {
    rememberWithEmbedding(fact: Fact, options: unknown): Promise<void>;
  };
  for (const [id, text] of [
    ['f-1', 'prefers window seats'],
    ['f-2', 'lives in Kyiv'],
    ['f-3', 'sister plays violin'],
  ] as const) {
    await semantic.rememberWithEmbedding(
      {
        id,
        kind: 'semantic',
        userId: 'alex',
        sensitivity: 'internal',
        text,
        createdAt: new Date().toISOString(),
      } as Fact,
      { embedding: { embedderId: `stub:src@${DIM}`, vector: new Float32Array([1, 0, 0, 0]) } },
    );
  }
  await store.close();
  return { cfg, dbPath, modulePath };
}

describe('graphorin memory migrate (wave-D D5)', () => {
  it('auto-migrates through the store pager, persists the cursor, retires and reclaims', async () => {
    const { cfg, dbPath, modulePath } = await seededSetup();
    const lines: string[] = [];
    const result = await runMemoryMigrate({
      from: `stub:src@${DIM}`,
      to: `stub:tgt@${DIM}`,
      strategy: 'auto-migrate',
      embeddersModule: modulePath,
      batchSize: 2,
      reclaim: true,
      config: cfg,
      print: (line) => {
        lines.push(line);
      },
    });
    expect(result.status).toBe('committed');
    expect(result.processed).toBe(3);
    expect(result.reclaimedTables.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.includes('kind=fact processed='))).toBe(true);

    // Post-conditions on the database itself.
    const store = await createSqliteStore({
      path: dbPath,
      mode: 'lib',
      embedderPolicy: 'multi-active',
    });
    await store.init();
    try {
      const src = store.embeddings.get(`stub:src@${DIM}`);
      expect(src?.retiredAt).not.toBeNull();
      const state = store.connection.get<{ status: string; processed: number }>(
        'SELECT status, processed FROM migration_state ORDER BY started_at DESC LIMIT 1',
      );
      expect(state?.status).toBe('committed');
      expect(state?.processed).toBe(3);
      const moved = store.connection.get<{ n: number }>(
        `SELECT COUNT(*) AS n FROM facts WHERE embedder_id = 'stub:tgt@${DIM}'`,
      );
      expect(moved?.n).toBe(3);
      // The retired source's vec tables are gone (--reclaim).
      const leftover = store.connection.get<{ n: number }>(
        `SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = '${src?.vecTableFacts}'`,
      );
      expect(leftover?.n).toBe(0);
    } finally {
      await store.close();
    }
  });

  it('a factory-less module and an unknown id exit UNSUPPORTED with pointers', async () => {
    const { cfg, modulePath } = await seededSetup();
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-migrate-bad-'));
    const badModule = join(dir, 'bad.mjs');
    await writeFile(badModule, 'export const nope = 1;', 'utf8');

    const exitCalls: Array<string | number | null | undefined> = [];
    const originalExit = process.exit;
    process.exit = ((code?: string | number | null) => {
      exitCalls.push(code);
      throw new Error(`exit:${code}`);
    }) as typeof process.exit;
    try {
      await expect(
        runMemoryMigrate({
          from: 'a',
          to: 'b',
          strategy: 'auto-migrate',
          embeddersModule: badModule,
          config: cfg,
          print: () => {},
        }),
      ).rejects.toThrow('exit:2');
      await expect(
        runMemoryMigrate({
          from: 'unknown:id@1',
          to: `stub:tgt@${DIM}`,
          strategy: 'auto-migrate',
          embeddersModule: modulePath,
          config: cfg,
          print: () => {},
        }),
      ).rejects.toThrow('exit:2');
      expect(exitCalls).toEqual([2, 2]);
    } finally {
      process.exit = originalExit;
    }
  });
});
