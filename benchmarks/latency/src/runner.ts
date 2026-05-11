/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Latency probes for semantic memory search (FTS path without embedder).
 * Emits p50/p95 on a synthetic fact corpus. Full-stream TTFT requires a
 * cached embedder plus a live provider; this harness documents budgets in
 * RESULTS.md and keeps CI hermetic on SQLite + FTS only.
 */

import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SessionScope } from '@graphorin/core';
import { createMemory } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';

export const VERSION = '0.1.0';

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
  return sorted[Math.max(0, idx)] ?? 0;
}

export async function measureMemorySearchLatency(options: {
  readonly factCount: number;
  readonly samples: number;
}): Promise<{ p50ms: number; p95ms: number; p99ms: number }> {
  const store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
  await store.init();
  const scope: SessionScope = { userId: 'lat-user', sessionId: 'lat-sess', agentId: 'lat-agent' };
  const memory = createMemory({
    store: store.memory as never,
    embeddings: store.embeddings,
    resolveScope: () => scope,
    conflictPipeline: { mode: 'off' },
    consolidator: { enabled: false },
  });

  for (let i = 0; i < options.factCount; i++) {
    await memory.semantic.remember(scope, {
      text: `Synthetic fact ${i}: metric=temperature unit=celsius value=${(i % 37) + 1}.`,
      sensitivity: 'internal',
    });
  }

  const latencies: number[] = [];
  for (let s = 0; s < options.samples; s++) {
    const q = `Synthetic fact ${(s * 17) % options.factCount}`;
    const t0 = performance.now();
    await memory.semantic.search(scope, q, { topK: 10 });
    latencies.push(performance.now() - t0);
  }
  await store.close();
  latencies.sort((a, b) => a - b);
  return {
    p50ms: percentile(latencies, 0.5),
    p95ms: percentile(latencies, 0.95),
    p99ms: percentile(latencies, 0.99),
  };
}

export async function main(): Promise<void> {
  const smoke = process.argv.includes('--smoke');
  const factCount = smoke ? 120 : 2000;
  const samples = smoke ? 24 : 80;
  const { p50ms, p95ms, p99ms } = await measureMemorySearchLatency({ factCount, samples });

  const budgetSearchP95Ms = 100;
  const pass = p95ms < budgetSearchP95Ms || smoke;

  const lines = [
    '# Latency probes — results',
    '',
    `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
    '',
    `_Generated: ${new Date().toISOString()}_`,
    '',
    '## Semantic memory search (FTS, no embedder)',
    '',
    '| Stat | ms |',
    '| --- | --- |',
    '| Facts ingested | ' + String(factCount) + ' |',
    '| Samples | ' + String(samples) + ' |',
    '| p50 | ' + p50ms.toFixed(3) + ' |',
    '| p95 | ' + p95ms.toFixed(3) + ' |',
    '| p99 | ' + p99ms.toFixed(3) + ' |',
    '| Budget p95 (10k-facts target doc) | ' + String(budgetSearchP95Ms) + ' ms |',
    '| CI pass (smoke relaxes hard gate) | ' + (pass ? 'yes' : 'no') + ' |',
    '',
    '## Streaming TTFT',
    '',
    'Hermetic CI does not download embedding weights. Measure time-to-first-token with a local cached embedder and your chosen `Provider` in a workstation profile; budgets are listed in the Graphorin MVP specification.',
    '',
  ];

  await writeFile(join(pkgRoot(), 'RESULTS.md'), lines.join('\n'), 'utf8');
  console.log(
    `[benchmark-latency] facts=${factCount} samples=${samples} p50=${p50ms.toFixed(2)}ms p95=${p95ms.toFixed(2)}ms`,
  );
  if (!pass) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
