import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  CliUsageError,
  countInfrastructureFailures,
  createOperationsAgent,
  INFRA_MARKER,
  parseArgs,
  runHaluMemBenchmark,
  USAGE,
  withBenchCostCeiling,
} from '../src/runner.js';
import { createHaluMemStubProvider } from '../src/stub-provider.js';

const FIXTURE = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'fixtures',
  'halumem.synthetic.json',
);

describe('benchmark-halumem operations stage (offline stub)', () => {
  it('replays the real ingest pipeline and produces a deterministic report', async () => {
    const run = () =>
      runHaluMemBenchmark({
        datasetPath: FIXTURE,
        stage: 'operations',
        provider: createHaluMemStubProvider(),
        conflictPipeline: 'off',
      });
    const first = await run();
    const second = await run();
    expect(first.summary.total).toBe(4);
    // Deterministic across runs: same per-case scores from the staged scorers.
    const scoresOf = (report: typeof first) =>
      report.results.map((r) => r.scores.map((s) => `${s.scorer}:${s.result.score ?? 'x'}`));
    expect(scoresOf(second)).toEqual(scoresOf(first));
    // All three staged scorers ran on every case.
    const firstScores = first.results[0]?.scores ?? [];
    expect(firstScores.map((s) => s.scorer)).toEqual([
      'memory-extraction-recall',
      'memory-extraction-precision',
      'memory-update-omission',
    ]);
  });

  it('runs the conflict-pipeline ON leg through the same plumbing (A/B axis)', async () => {
    const report = await runHaluMemBenchmark({
      datasetPath: FIXTURE,
      stage: 'operations',
      provider: createHaluMemStubProvider(),
      conflictPipeline: 'on',
      smoke: true,
    });
    expect(report.summary.total).toBe(2);
    // Every case produced an observation (no case-level crashes).
    expect(report.results.every((r) => Array.isArray(r.output.memoryPoints))).toBe(true);
  });

  it('observes post-ingest memory points via the store listActive surface', async () => {
    const agent = createOperationsAgent({
      provider: createHaluMemStubProvider(),
      conflictPipeline: 'off',
    });
    const observation = await agent.run({
      haystackSessions: [
        {
          id: 's1',
          turns: [{ role: 'user', content: 'My sister Anna is a violinist.' }],
        },
      ],
      goldPoints: [{ kind: 'extract', content: "User's sister Anna plays the violin" }],
    });
    // The stub extracts raw user turns as facts, so the turn text must
    // surface as an observed memory point.
    expect(observation.memoryPoints.some((p) => p.includes('Anna'))).toBe(true);
    expect(observation.answer).toBeUndefined();
  });

  it('qa stage answers the probe and applies the hallucination judge', async () => {
    const report = await runHaluMemBenchmark({
      datasetPath: FIXTURE,
      stage: 'qa',
      provider: createHaluMemStubProvider(),
      // The stub judge reply carries no SCORE marker, so the scorer
      // records an error rather than a fake grade - assert the shape.
      judgeProvider: createHaluMemStubProvider(),
      smoke: true,
    });
    expect(report.summary.total).toBe(2);
    for (const result of report.results) {
      expect(result.output?.answer).toBe('I do not have that information.');
    }
  });
});

const BENCH_CAPABILITIES = {
  streaming: false,
  toolCalling: false,
  parallelToolCalls: false,
  multimodal: false,
  structuredOutput: true,
  reasoning: false,
  contextWindow: 32_000,
  maxOutput: 4_000,
} as const;

describe('deep-retest-0.13.6 P2-3 - infrastructure failures are not quality zeros', () => {
  function createFailingProvider(): Provider {
    return {
      name: 'failing-openai-compatible',
      modelId: 'gpt-4o-mini',
      capabilities: BENCH_CAPABILITIES,
      async generate(): Promise<ProviderResponse> {
        throw new Error('HTTP 404 from http://example.invalid/v1/v1/chat/completions');
      },
      stream(): AsyncIterable<never> {
        throw new Error('no stream');
      },
    };
  }

  it('a provider failure during ingest is stamped as infrastructure, per case', async () => {
    const report = await runHaluMemBenchmark({
      datasetPath: FIXTURE,
      stage: 'operations',
      provider: createFailingProvider(),
      conflictPipeline: 'off',
      smoke: true,
    });
    expect(report.summary.failed).toBe(2);
    const infra = countInfrastructureFailures(report);
    expect(infra.count).toBe(2);
    const reason = report.results[0]?.scores[0]?.result.reason ?? '';
    expect(reason).toContain('agent.run threw');
    expect(reason).toContain(INFRA_MARKER);
    expect(reason).toContain('NOT a quality result');
    // The observation never materializes - no empty memoryPoints that
    // could read as a measured quality zero.
    expect(report.results[0]?.output).toBeUndefined();
  });

  it('a clean stub run counts zero infrastructure failures', async () => {
    const report = await runHaluMemBenchmark({
      datasetPath: FIXTURE,
      stage: 'operations',
      provider: createHaluMemStubProvider(),
      conflictPipeline: 'off',
      smoke: true,
    });
    expect(countInfrastructureFailures(report).count).toBe(0);
  });
});

describe('deep-retest-0.13.6 P2-4 - --max-cost-usd observes real spend', () => {
  function createUsageProvider(modelId: string): Provider {
    return {
      name: 'usage-reporter',
      modelId,
      capabilities: BENCH_CAPABILITIES,
      async generate(_req: ProviderRequest): Promise<ProviderResponse> {
        return {
          text: '{"facts":[]}',
          usage: { promptTokens: 1_000_000, completionTokens: 0, totalTokens: 1_000_000 },
          finishReason: 'stop',
        };
      },
      stream(): AsyncIterable<never> {
        throw new Error('no stream');
      },
    };
  }
  const REQ: ProviderRequest = { messages: [{ role: 'user', content: 'hi' }] };

  it('prices usage via the bundled snapshot and trips the ceiling', async () => {
    const ceiling = withBenchCostCeiling(0.5);
    const wrapped = ceiling.wrap(createUsageProvider('gpt-5.6-luna'));
    await wrapped.generate(REQ);
    // 1M prompt tokens at the snapshot's $1/Mtok input rate.
    expect(ceiling.observedCostUsd()).toBeCloseTo(1, 5);
    await expect(wrapped.generate(REQ)).rejects.toThrow(/cost|budget|exceed/i);
  });

  it('unknown models keep honest zeros so main() can warn UNENFORCED', async () => {
    const ceiling = withBenchCostCeiling(0.5);
    const wrapped = ceiling.wrap(createUsageProvider('model-not-in-snapshot'));
    await wrapped.generate(REQ);
    expect(ceiling.observedCostUsd()).toBe(0);
  });

  it('deep-retest 0.13.7 P3: names unpriced models so reports can stamp costPricingMatched', async () => {
    const priced = withBenchCostCeiling(2);
    await priced.wrap(createUsageProvider('gpt-5.6-luna')).generate(REQ);
    expect(priced.unpricedModels()).toEqual([]);

    const unpriced = withBenchCostCeiling(2);
    await unpriced.wrap(createUsageProvider('model-not-in-snapshot')).generate(REQ);
    expect(unpriced.unpricedModels()).toEqual(['model-not-in-snapshot']);
  });
});

describe('deep-retest-0.13.6 P2-Q - embedder axis', () => {
  it('the fake embedder runs the vector leg through the full ingest pipeline', async () => {
    const report = await runHaluMemBenchmark({
      datasetPath: FIXTURE,
      stage: 'operations',
      provider: createHaluMemStubProvider(),
      conflictPipeline: 'on',
      embedder: 'fake',
      smoke: true,
    });
    expect(report.summary.total).toBe(2);
    expect(countInfrastructureFailures(report).count).toBe(0);
    expect(report.results.every((r) => Array.isArray(r.output.memoryPoints))).toBe(true);
  });
});

describe('benchmark-halumem CLI', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'halumem-cli-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('documents every accepted flag in USAGE and validates values', () => {
    const flags = [
      '--dataset',
      '--stage',
      '--conflict-pipeline',
      '--embedder',
      '--smoke',
      '--results',
      '--json',
      '--provider',
      '--model',
      '--base-url',
      '--judge-provider',
      '--judge-model',
      '--judge-base-url',
      '--max-cost-usd',
      '--help',
    ];
    for (const flag of flags) expect(USAGE).toContain(flag);
    expect(parseArgs(['node', 'runner.js', '--stage', 'qa']).stage).toBe('qa');
    expect(parseArgs(['node', 'runner.js', '--conflict-pipeline', 'on']).conflictPipeline).toBe(
      'on',
    );
    expect(() => parseArgs(['node', 'runner.js', '--stage', 'both'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--conflict-pipeline', 'x'])).toThrow(
      CliUsageError,
    );
    expect(parseArgs(['node', 'runner.js', '--embedder', 'fake']).embedder).toBe('fake');
    expect(() => parseArgs(['node', 'runner.js', '--embedder', 'real'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--max-cost-usd', '0'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--typo'])).toThrow(/--typo/);
  });

  it('main() writes RESULTS + JSON with the benchConfig stamp', async () => {
    const { main } = await import('../src/runner.js');
    const results = join(dir, 'RESULTS.md');
    const json = join(dir, 'report.json');
    const originalArgv = process.argv;
    process.argv = [
      'node',
      'runner.js',
      '--results',
      results,
      '--json',
      json,
      '--smoke',
      '--conflict-pipeline',
      'on',
    ];
    try {
      await main();
    } finally {
      process.argv = originalArgv;
    }
    const md = await readFile(results, 'utf8');
    expect(md).toContain('operation-level memory benchmark results');
    expect(md).toContain('**Conflict pipeline:** on');
    expect(md).toContain('stub (plumbing-only)');
    const parsed = JSON.parse(await readFile(json, 'utf8')) as {
      benchConfig: { stage: string; conflictPipeline: string; provider: string };
    };
    expect(parsed.benchConfig.stage).toBe('operations');
    expect(parsed.benchConfig.conflictPipeline).toBe('on');
    expect(parsed.benchConfig.provider).toContain('stub');
  });
});
