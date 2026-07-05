/**
 * Graphorin v0.1.0 - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Synthetic dialogue memory simulation: seeded PRNG emits short fact
 * strings, persists them via SemanticMemory, then checks whether hybrid
 * search recalls a needle phrase (substring match on top hit).
 */

import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SessionScope } from '@graphorin/core';
import { createMemory } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';

export const VERSION = '0.1.0';

/** Reduces FTS5 mismatches when a period glues onto the last token. */
function normalizeFactForFts(text: string): string {
  if (text.includes('@')) return text;
  return text.replace(/\.(?=\s|$)/g, '');
}

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function runMemorySim(options: {
  readonly seed: number;
  readonly rounds: number;
}): Promise<{
  readonly hitRate: number;
}> {
  const rnd = mulberry32(options.seed);
  const store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
  await store.init();
  const scope: SessionScope = { userId: 'sim-user', sessionId: 'sim-sess' };
  const memory = createMemory({
    store: store.memory as never,
    embeddings: store.embeddings,
    resolveScope: () => scope,
    conflictPipeline: { mode: 'off' },
    consolidator: { enabled: false },
  });

  let hits = 0;
  for (let i = 0; i < options.rounds; i++) {
    const needle = `needle-${i}-tok-${Math.floor(rnd() * 1000)}`;
    const filler = `context-${i}-${Math.floor(rnd() * 1e6)}`;
    await memory.semantic.remember(scope, {
      text: normalizeFactForFts(`Profile note: ${filler}.`),
      sensitivity: 'internal',
    });
    await memory.semantic.remember(scope, {
      text: normalizeFactForFts(`Profile note: user token ${needle}.`),
      sensitivity: 'internal',
    });
    const q = `token ${needle}`;
    const top = await memory.semantic.search(scope, q, { topK: 3 });
    const text = top[0]?.record.text ?? '';
    if (text.includes(needle)) hits += 1;
  }
  await store.close();
  return { hitRate: hits / options.rounds };
}

export async function main(): Promise<void> {
  const smoke = process.argv.includes('--smoke');
  const rounds = smoke ? 8 : 64;
  const { hitRate } = await runMemorySim({ seed: 0x9e37_79b9, rounds });
  const lines = [
    '# Memory simulation - results',
    '',
    `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
    '',
    `_Generated: ${new Date().toISOString()}_`,
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Rounds | ${String(rounds)} |`,
    `| Top-1 hit rate | ${hitRate.toFixed(4)} |`,
    '',
  ];
  await writeFile(join(pkgRoot(), 'RESULTS.md'), lines.join('\n'), 'utf8');
  console.log(`[benchmark-memory-sim] rounds=${rounds} hitRate=${hitRate.toFixed(4)}`);
  // E7 (evals-12): the gate used to be `hitRate < 0.85 && !smoke` - and CI
  // only ever ran --smoke, so it could never fire. The sim is fully
  // deterministic (seeded PRNG + FTS recall), so arming the gate in smoke
  // mode carries zero flake risk.
  if (hitRate < 0.85) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
