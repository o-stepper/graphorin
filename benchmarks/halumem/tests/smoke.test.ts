import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  CliUsageError,
  createOperationsAgent,
  parseArgs,
  runHaluMemBenchmark,
  USAGE,
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
