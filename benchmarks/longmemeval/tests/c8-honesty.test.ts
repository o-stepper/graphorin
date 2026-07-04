/**
 * C8 (evals-01/02/05/06/09) — eval-honesty mechanics, all offline:
 * - the retrieval/embedder A/B switches drive the REAL library config and
 *   the run completes under every mode
 * - the keyword fan-out booster is gone (recall = the real search path)
 * - iterations produce per-iteration pass rates + variance
 * - the ingest cache holds the PROMISE (no double ingest under
 *   concurrency)
 * - the committed stub baseline stays reproducible
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectRegressions } from '@graphorin/evals';
import { describe, expect, it } from 'vitest';
import {
  computeBenchAggregates,
  createFakeEmbedder,
  createMemorySystemAgent,
  createRetrievalStats,
  REGRESSION_TOLERANCES,
  type RetrievalMode,
  runLongMemEvalBenchmark,
} from '../src/runner.js';
import { createDefaultStubProvider } from '../src/stub-provider.js';

// fileURLToPath (not URL.pathname) — pathname yields '/D:/…' on Windows.
const PKG_ROOT = fileURLToPath(new URL('..', import.meta.url));
const FIXTURE = join(PKG_ROOT, 'data', 'fixture.json');

describe('C8 — retrieval/embedder A/B switches', () => {
  const modes: RetrievalMode[] = ['default', 'multi-query', 'hyde', 'iterative', 'graph'];
  for (const retrieval of modes) {
    it(`completes the fixture under retrieval='${retrieval}' with the fake embedder`, async () => {
      const stats = createRetrievalStats();
      const report = await runLongMemEvalBenchmark({
        datasetPath: FIXTURE,
        provider: createDefaultStubProvider(),
        retrieval,
        embedder: 'fake',
        retrievalStats: stats,
      });
      expect(report.summary.total).toBe(3);
      if (retrieval === 'iterative') {
        expect(stats.queries).toBe(3);
      }
    });
  }

  it('the fake embedder is deterministic and unit-normalized', async () => {
    const embedder = createFakeEmbedder(32);
    const [a] = await embedder.embed(['mochi the cat works from home']);
    const [b] = await embedder.embed(['mochi the cat works from home']);
    expect(a).toEqual(b);
    let norm = 0;
    for (const v of a ?? []) norm += v * v;
    expect(Math.sqrt(norm)).toBeCloseTo(1, 6);
  });
});

describe('C8 — multi-seed variance + abstention aggregates', () => {
  it('iterations=2 yields two per-iteration pass rates and a stddev', async () => {
    const report = await runLongMemEvalBenchmark({
      datasetPath: FIXTURE,
      provider: createDefaultStubProvider(),
      iterations: 2,
    });
    expect(report.summary.total).toBe(6);
    const aggregates = computeBenchAggregates(report);
    expect(aggregates.passRates).toHaveLength(2);
    // The stub is deterministic, so the two iterations agree exactly.
    expect(aggregates.passRateStddev).toBe(0);
    expect(aggregates.abstentionRate).not.toBeNull();
  });
});

describe('C8 — ingest promise cache (evals-09)', () => {
  it('ingests a shared haystack exactly once under concurrent cases', async () => {
    let ingests = 0;
    const agent = createMemorySystemAgent({
      provider: createDefaultStubProvider(),
      onIngest: () => {
        ingests += 1;
      },
    });
    const haystackSessions = [
      {
        id: 's1',
        turns: [{ role: 'user' as const, content: 'I adopted a dog named Rex.' }],
      },
    ];
    const inputs = Array.from({ length: 4 }, (_, i) => ({
      question: `question ${i} about Rex`,
      haystackSessions,
      ability: 'info-extraction' as const,
    }));
    await Promise.all(inputs.map((input) => agent.run(input as never)));
    expect(ingests).toBe(1);
  });
});

describe('C8 — committed stub baseline is reproducible', () => {
  it('a fresh stub run shows no regression against the committed baseline', async () => {
    const baselinePath = join(PKG_ROOT, 'baselines', 'longmemeval.fixture.stub.json');
    const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
    const report = await runLongMemEvalBenchmark({
      datasetPath: FIXTURE,
      provider: createDefaultStubProvider(),
    });
    const regression = detectRegressions(report, baseline, REGRESSION_TOLERANCES);
    expect(regression.hasRegressions).toBe(false);
  });
});
