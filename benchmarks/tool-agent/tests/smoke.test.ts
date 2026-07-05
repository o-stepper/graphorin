/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 */

import { describe, expect, it } from 'vitest';

import { runToolAgentSuite } from '../src/harness.js';
import { runToolAgentBenchmark, VERSION } from '../src/runner.js';
import { brokenTask, DEFAULT_TASKS } from '../src/tasks.js';

describe('benchmarks/tool-agent', () => {
  it('exposes VERSION = 0.1.0', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('runs the default suite fully offline and deterministically (pass^k = 1)', async () => {
    const a = await runToolAgentSuite({ k: 2 });
    expect(a.taskCount).toBe(DEFAULT_TASKS.length);
    expect(a.passAt1).toBe(1);
    expect(a.passAtK).toBe(1);

    // Determinism: a second independent run yields identical per-task metrics.
    const b = await runToolAgentSuite({ k: 2 });
    expect(b.passAtK).toBe(a.passAtK);
    for (const ta of a.tasks) {
      const tb = b.tasks.find((x) => x.taskId === ta.taskId);
      expect(tb?.scorerAverages).toEqual(ta.scorerAverages);
    }
  });

  it('reports a perfect average for every scorer on the good suite', async () => {
    const m = await runToolAgentSuite({ k: 1 });
    const entries = Object.entries(m.scorerAverages);
    expect(entries.length).toBe(5);
    for (const [, avg] of entries) expect(avg).toBe(1);
  });

  it('exercises real error recovery: the recovery task records an error then recovers', async () => {
    const m = await runToolAgentSuite({ k: 1 });
    const recovery = m.tasks.find((t) => t.taskId === 'recover-from-payment-failure');
    expect(recovery?.passAtK).toBe(true);
    expect(recovery?.scorerAverages['recovery-after-error']).toBe(1);
  });

  it('a deliberately broken harness fixture fails the pass^k gate', async () => {
    const m = await runToolAgentSuite({ k: 2, tasks: [brokenTask] });
    expect(m.passAtK).toBeLessThan(1);
    expect(m.tasks[0]?.passAtK).toBe(false);
    // The break is visible to the tool-selection and goal-state scorers.
    expect(m.tasks[0]?.failReasons.join(' ')).toMatch(/final-state-correct|correct-tool-selected/);
  });

  it('runToolAgentBenchmark passes against the committed baseline', async () => {
    const m = await runToolAgentBenchmark();
    expect(m.passAtK).toBe(1);
    expect(m.passAt1).toBe(1);
  });
});
