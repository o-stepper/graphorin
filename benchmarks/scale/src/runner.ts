import pkg from '../package.json' with { type: 'json' };
/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Memory-store SCALE probe (audit 2026-07-04, E7). Every other benchmark
 * assesses correctness at toy corpus sizes; this one asks "where does the
 * store stop being comfortable?". It seeds a FILE-backed SQLite store with a
 * large synthetic corpus - vectors on (deterministic bag-of-words embedder,
 * so vec0 KNN + hybrid RRF run for real) and an entity graph built from
 * s/p/o on every fact - then measures:
 *
 *   - seeding throughput (facts/s, the write path incl. FTS + vec0 + entity
 *     linking)
 *   - hybrid search (FTS + vector + RRF) p50/p95
 *   - graph-expanded search (expandHops: 2, graphScoring: 'ppr') p50/p95
 *   - consolidator light-phase pass time (offline decay/salience sweep over
 *     the whole corpus; no provider involved)
 *   - on-disk DB size after a WAL checkpoint
 *
 * Numbers are REPORTED, not gated (EB-4: absolute wall-clock budgets are
 * environment-sensitive). `--smoke` runs a small corpus and gates only on
 * deterministic plumbing assertions so CI proves the harness itself works.
 * Full mode (default 100k facts, `--facts N` to override) is a workstation
 * profile; its results feed documentation/guide/performance.md.
 */

import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { EmbedderProvider, SessionScope } from '@graphorin/core';
import { createMemory } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';

export const VERSION: string = pkg.version;

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
  return sorted[Math.max(0, idx)] ?? 0;
}

/**
 * Deterministic bag-of-words embedder (FNV-1a hashed tokens, L2-normalized) -
 * the same shape `@graphorin/benchmark-longmemeval` uses. It has no semantic
 * quality; it exists so the vector leg + vec0 index run for real offline.
 */
export function createFakeEmbedder(dim = 64): EmbedderProvider {
  function embedOne(text: string): Float32Array {
    const vec = new Float32Array(dim);
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    for (const token of tokens) {
      let hash = 0x811c9dc5;
      for (let i = 0; i < token.length; i++) {
        hash ^= token.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
      }
      const slot = (hash >>> 0) % dim;
      vec[slot] = (vec[slot] ?? 0) + 1;
    }
    let norm = 0;
    for (const v of vec) norm += v * v;
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dim; i++) vec[i] = (vec[i] ?? 0) / norm;
    }
    return vec;
  }
  return {
    id: () => `fake:bow-${dim}`,
    dim: () => dim,
    configHash: () => `fake-bow-${dim}`,
    embed: async (texts) => texts.map((t) => embedOne(t)),
  };
}

const TOPICS = [
  'deployment',
  'billing',
  'onboarding',
  'retrieval',
  'consolidation',
  'observability',
  'sandboxing',
  'provisioning',
];

export interface ScaleResult {
  readonly factCount: number;
  readonly seedSeconds: number;
  readonly seedFactsPerSecond: number;
  readonly hybrid: { readonly p50ms: number; readonly p95ms: number; readonly samples: number };
  readonly graph: { readonly p50ms: number; readonly p95ms: number; readonly samples: number };
  /** hop-2 PPR expansion - measured with a FEW samples only; see the hot-spot note in main(). */
  readonly graphHop2: {
    readonly p50ms: number;
    readonly p95ms: number;
    readonly samples: number;
  } | null;
  readonly hybridHitRate: number;
  readonly graphHitRate: number;
  readonly lightPhaseSeconds: number | null;
  readonly dbBytes: number;
  readonly entities: number;
}

export async function runScaleBenchmark(options: {
  readonly factCount: number;
  readonly querySamples: number;
  /** hop-2 samples; 0 skips the leg (CI smoke - a single hop-2 query can run for seconds). */
  readonly hop2Samples?: number;
}): Promise<ScaleResult> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-scale-'));
  const dbPath = join(dir, 'scale.db');
  const store = await createSqliteStore({ path: dbPath, disableWalHardening: true });
  await store.init();
  const scope: SessionScope = { userId: 'sc-user', sessionId: 'sc-sess', agentId: 'sc-agent' };
  const memory = createMemory({
    store: store.memory as never,
    embeddings: store.embeddings,
    resolveScope: () => scope,
    embedder: createFakeEmbedder(64),
    conflictPipeline: { mode: 'off' },
    // Offline tier: the light phase (decay/salience) needs no provider.
    consolidator: { enabled: true, tier: 'free', defaultScope: scope },
    // Entity graph on: every fact carries s/p/o, so seeding builds a real
    // graph (people reused across facts = hub entities) and the PPR leg has
    // something to traverse.
    graph: { entityResolution: true },
  });

  const people = Math.max(4, Math.floor(options.factCount / 50));
  const projects = Math.max(4, Math.min(400, Math.floor(options.factCount / 250) || 4));

  const seedStart = performance.now();
  for (let i = 0; i < options.factCount; i++) {
    const person = `person-${i % people}`;
    const project = `project-${i % projects}`;
    const topic = TOPICS[i % TOPICS.length] ?? 'deployment';
    await memory.semantic.remember(scope, {
      text: `${person} works on ${project} covering ${topic} milestone ${i}.`,
      subject: person,
      predicate: 'works_on',
      object: project,
      sensitivity: 'internal',
    });
  }
  const seedSeconds = (performance.now() - seedStart) / 1000;

  // Hybrid (FTS + vector + RRF) - keyword queries with a known-present token.
  const hybridLat: number[] = [];
  let hybridHits = 0;
  for (let s = 0; s < options.querySamples; s++) {
    const i = (s * 3571) % options.factCount;
    const q = `project-${i % projects} ${TOPICS[i % TOPICS.length]} milestone`;
    const t0 = performance.now();
    const hits = await memory.semantic.search(scope, q, { topK: 10 });
    hybridLat.push(performance.now() - t0);
    if (hits.length > 0) hybridHits += 1;
  }

  // Graph-expanded search - the P2-1/D5 recursive-CTE + PPR path. Hop-1 is
  // the primary metric; hop-2 is measured with a handful of samples because
  // the fact-level walk re-expands hub-entity fanout (each seed fact's hub
  // project links hundreds of facts, and search seeds the walk with up to
  // candidateTopK ids) - single hop-2 queries run for SECONDS. That cliff is
  // a deliberate finding of this probe, not something to average away.
  const graphLat: number[] = [];
  let graphHits = 0;
  for (let s = 0; s < options.querySamples; s++) {
    const i = (s * 7919) % options.factCount;
    const q = `person-${i % people} works_on`;
    const t0 = performance.now();
    const hits = await memory.semantic.search(scope, q, {
      topK: 10,
      expandHops: 1,
      graphScoring: 'ppr',
    });
    graphLat.push(performance.now() - t0);
    if (hits.length > 0) graphHits += 1;
  }

  const hop2Samples = Math.max(0, options.hop2Samples ?? 0);
  const hop2Lat: number[] = [];
  for (let s = 0; s < hop2Samples; s++) {
    const i = (s * 104729) % options.factCount;
    const q = `person-${i % people} works_on`;
    const t0 = performance.now();
    await memory.semantic.search(scope, q, { topK: 10, expandHops: 2, graphScoring: 'ppr' });
    hop2Lat.push(performance.now() - t0);
  }

  // Consolidator light phase: offline decay/salience sweep over the corpus.
  let lightPhaseSeconds: number | null = null;
  try {
    const t0 = performance.now();
    await memory.consolidator.fireNow('light', scope);
    lightPhaseSeconds = (performance.now() - t0) / 1000;
  } catch {
    lightPhaseSeconds = null; // surfaced as n/a in the report
  }

  // On-disk size after folding the WAL back into the main file.
  const raw = (
    store as unknown as {
      connection?: { raw?: () => { pragma: (s: string) => unknown } };
    }
  ).connection?.raw?.();
  try {
    raw?.pragma('wal_checkpoint(TRUNCATE)');
  } catch {
    // best-effort; fs.stat below still reports the main-file size
  }
  const entities = countEntities(raw);
  const dbBytes = (await stat(dbPath)).size;

  await store.close();
  await rm(dir, { recursive: true, force: true });

  hybridLat.sort((a, b) => a - b);
  graphLat.sort((a, b) => a - b);
  hop2Lat.sort((a, b) => a - b);
  return {
    factCount: options.factCount,
    seedSeconds,
    seedFactsPerSecond: options.factCount / Math.max(seedSeconds, 1e-9),
    hybrid: {
      p50ms: percentile(hybridLat, 0.5),
      p95ms: percentile(hybridLat, 0.95),
      samples: options.querySamples,
    },
    graph: {
      p50ms: percentile(graphLat, 0.5),
      p95ms: percentile(graphLat, 0.95),
      samples: options.querySamples,
    },
    graphHop2:
      hop2Samples === 0
        ? null
        : {
            p50ms: percentile(hop2Lat, 0.5),
            p95ms: percentile(hop2Lat, 0.95),
            samples: hop2Samples,
          },
    hybridHitRate: options.querySamples === 0 ? 0 : hybridHits / options.querySamples,
    graphHitRate: options.querySamples === 0 ? 0 : graphHits / options.querySamples,
    lightPhaseSeconds,
    dbBytes,
    entities,
  };
}

function countEntities(raw: { pragma: (s: string) => unknown } | undefined): number {
  if (raw === undefined) return -1;
  try {
    const db = raw as unknown as {
      prepare: (sql: string) => { get: () => { n?: number } | undefined };
    };
    return db.prepare('SELECT COUNT(*) AS n FROM entities').get()?.n ?? -1;
  } catch {
    return -1;
  }
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GiB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

export async function main(): Promise<void> {
  const smoke = process.argv.includes('--smoke');
  const factsFlag = process.argv.indexOf('--facts');
  const factCount =
    factsFlag !== -1 && process.argv[factsFlag + 1] !== undefined
      ? Math.max(100, Number.parseInt(process.argv[factsFlag + 1] ?? '0', 10) || 0)
      : smoke
        ? 2000
        : 100_000;
  const querySamples = smoke ? 50 : 200;
  // Smoke skips hop-2 entirely: one hop-2 query can run for SECONDS (the
  // fact-level walk re-expands hub fanout for every seed candidate), which
  // is a documented finding, not a per-PR cost worth paying.
  const hop2Samples = smoke ? 0 : 5;

  console.log(`[benchmark-scale] seeding ${factCount} facts...`);
  const r = await runScaleBenchmark({ factCount, querySamples, hop2Samples });

  const lines = [
    '# Memory-store scale probe - results',
    '',
    `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
    '',
    `_Generated: ${new Date().toISOString()}_`,
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Facts | ${String(r.factCount)} |`,
    `| Entities (canonical) | ${r.entities >= 0 ? String(r.entities) : 'n/a'} |`,
    `| Seed time | ${r.seedSeconds.toFixed(1)} s (${r.seedFactsPerSecond.toFixed(0)} facts/s) |`,
    `| Hybrid search p50 / p95 (${String(r.hybrid.samples)} q) | ${r.hybrid.p50ms.toFixed(2)} / ${r.hybrid.p95ms.toFixed(2)} ms |`,
    `| Graph PPR search (hops=1) p50 / p95 (${String(r.graph.samples)} q) | ${r.graph.p50ms.toFixed(2)} / ${r.graph.p95ms.toFixed(2)} ms |`,
    `| Graph PPR search (hops=2, HOT SPOT) p50 / p95 (${String(r.graphHop2?.samples ?? 0)} q) | ${r.graphHop2 === null ? 'skipped' : `${r.graphHop2.p50ms.toFixed(0)} / ${r.graphHop2.p95ms.toFixed(0)} ms`} |`,
    `| Hybrid / graph hit rate | ${r.hybridHitRate.toFixed(3)} / ${r.graphHitRate.toFixed(3)} |`,
    `| Consolidator light pass | ${r.lightPhaseSeconds === null ? 'n/a' : `${r.lightPhaseSeconds.toFixed(1)} s`} |`,
    `| DB size on disk | ${fmtBytes(r.dbBytes)} (${String(r.dbBytes)} bytes) |`,
    '',
    'Numbers are environment-sensitive (measured on whatever ran this file);',
    'gate decisions belong to the deterministic plumbing assertions in',
    '`--smoke`, not to these wall-clock values (EB-4). Full-mode results are',
    'summarized in `documentation/guide/performance.md`.',
    '',
  ];
  await writeFile(join(pkgRoot(), 'RESULTS.md'), lines.join('\n'), 'utf8');
  console.log(
    `[benchmark-scale] facts=${r.factCount} seed=${r.seedSeconds.toFixed(1)}s (${r.seedFactsPerSecond.toFixed(0)}/s) ` +
      `hybrid p95=${r.hybrid.p95ms.toFixed(2)}ms graph1 p95=${r.graph.p95ms.toFixed(2)}ms ` +
      `graph2 p95=${r.graphHop2 === null ? 'skipped' : `${r.graphHop2.p95ms.toFixed(0)}ms`} ` +
      `light=${r.lightPhaseSeconds === null ? 'n/a' : `${r.lightPhaseSeconds.toFixed(1)}s`} db=${fmtBytes(r.dbBytes)}`,
  );

  if (smoke) {
    // Deterministic plumbing gates only - no wall-clock assertions.
    const problems: string[] = [];
    if (r.hybridHitRate < 0.9) problems.push(`hybrid hit rate ${r.hybridHitRate}`);
    if (r.graphHitRate < 0.9) problems.push(`graph hit rate ${r.graphHitRate}`);
    if (r.entities === 0) problems.push('entity graph empty despite s/p/o seeding');
    if (r.lightPhaseSeconds === null) problems.push('light phase did not run');
    if (r.dbBytes <= 0) problems.push('db file empty');
    if (problems.length > 0) {
      console.error(`[benchmark-scale] SMOKE FAIL: ${problems.join('; ')}`);
      process.exitCode = 1;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
