import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Offline smoke test: the LongMemEval runner must produce a report on
 * the committed fixture using the deterministic stub provider - no
 * model, no network.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { MemoryEvalInput, MemoryEvalSession } from '@graphorin/evals';
import { describe, expect, it } from 'vitest';

import { createMemorySystemAgent, runLongMemEvalBenchmark, VERSION } from '../src/runner.js';
import { createDefaultStubProvider, createStubProvider } from '../src/stub-provider.js';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = join(pkg, 'data', 'fixture.json');

describe('benchmarks/longmemeval', () => {
  it('exposes the package.json version', () => {
    expect(VERSION).toBe(pkgVersion);
  });

  it('runs fully offline on the fixture with a stub provider', async () => {
    const report = await runLongMemEvalBenchmark({
      datasetPath: fixture,
      provider: createDefaultStubProvider(),
    });
    expect(report.summary.total).toBe(3);
    // both scorers ran on every case, in order
    expect(report.results[0]?.scores.map((s) => s.scorer)).toEqual(['llm-judge-j', 'abstention']);
    // the "J" judge produced a numeric score
    expect(report.summary.byScorer['llm-judge-j']?.avgScore).not.toBeNull();
  });

  it('filters to a single ability for per-category gates', async () => {
    const report = await runLongMemEvalBenchmark({
      datasetPath: fixture,
      ability: 'abstention',
      provider: createDefaultStubProvider(),
    });
    expect(report.summary.total).toBe(1);
  });

  it('ingests each conversation once across its QA cases, with sample isolation (EB-11)', async () => {
    // Two samples; every question of one sample shares ONE `haystackSessions`
    // array reference - exactly as the LOCOMO loader emits them.
    const sessionsA: MemoryEvalSession[] = [
      {
        id: 's1',
        turns: [
          { role: 'user', content: 'My dog is named Rex and lives in Berlin.' },
          { role: 'assistant', content: 'Noted: Rex in Berlin.' },
        ],
      },
    ];
    const sessionsB: MemoryEvalSession[] = [
      {
        id: 's1',
        turns: [
          { role: 'user', content: 'My cat is named Mochi and lives in Rome.' },
          { role: 'assistant', content: 'Noted: Mochi in Rome.' },
        ],
      },
    ];
    const cases: MemoryEvalInput[] = [
      { haystackSessions: sessionsA, question: 'dog', ability: 'info-extraction' },
      { haystackSessions: sessionsA, question: 'Berlin', ability: 'info-extraction' },
      { haystackSessions: sessionsB, question: 'cat', ability: 'info-extraction' },
      { haystackSessions: sessionsB, question: 'Rome', ability: 'info-extraction' },
    ];

    let ingests = 0;
    const contexts: string[] = [];
    const agent = createMemorySystemAgent({
      onIngest: () => {
        ingests += 1;
      },
      provider: createStubProvider((req) => {
        contexts.push(JSON.stringify(req.messages));
        return 'ok';
      }),
    });

    for (const c of cases) {
      await agent.run(c);
    }

    // 4 questions across 2 conversations → 2 ingests, not 4.
    expect(ingests).toBe(2);
    // Isolation: sample A's recalls surface its own fact and can NEVER surface
    // sample B's (separate per-conversation stores).
    const rexContexts = contexts.filter((c) => c.includes('Rex'));
    expect(rexContexts.length).toBeGreaterThan(0);
    expect(rexContexts.some((c) => c.includes('Mochi'))).toBe(false);
  });
});
