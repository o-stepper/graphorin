import { describe, expect, it } from 'vitest';

import { type ComparableReport, parseCompareArgs, renderComparison } from '../src/compare.js';

function report(
  conflictPipeline: string,
  cases: ReadonlyArray<{ id: string; omission: boolean }>,
): ComparableReport {
  return {
    summary: {
      total: cases.length,
      passed: cases.filter((c) => c.omission).length,
      failed: cases.filter((c) => !c.omission).length,
    },
    results: cases.map((c) => ({
      caseId: c.id,
      scores: [
        { scorer: 'memory-extraction-recall', result: { pass: true, score: 1 } },
        {
          scorer: 'memory-update-omission',
          result: { pass: c.omission, score: c.omission ? 1 : 0 },
        },
      ],
    })),
    benchConfig: { conflictPipeline, stage: 'operations', provider: 'openai-compatible:test' },
  };
}

describe('halumem A/B comparison (deep-retest-0.13.11 P2)', () => {
  it('renders per-scorer summary with deltas and per-case breakdowns', () => {
    const on = report('on', [
      { id: 'relocation', omission: true },
      { id: 'diet', omission: false },
    ]);
    const off = report('off', [
      { id: 'relocation', omission: false },
      { id: 'diet', omission: false },
    ]);
    const md = renderComparison(on, off, 'conflict-pipeline on', 'conflict-pipeline off');
    expect(md).toContain('| memory-update-omission | 1/2 | 0/2 | +1 (A) |');
    expect(md).toContain('| memory-extraction-recall | 2/2 | 2/2 | 0 |');
    expect(md).toContain('## memory-update-omission - per case');
    expect(md).toContain('| relocation | pass | FAIL |');
    expect(md).toContain('| diet | FAIL | FAIL |');
  });

  it('a case missing from one leg renders as "-"', () => {
    const a = report('on', [{ id: 'only-a', omission: true }]);
    const b = report('off', [{ id: 'only-b', omission: true }]);
    const md = renderComparison(a, b, 'A', 'B');
    expect(md).toContain('| only-a | pass | - |');
    expect(md).toContain('| only-b | - | pass |');
  });

  it('parseCompareArgs requires --a and --b and rejects unknown flags', () => {
    expect(() => parseCompareArgs(['node', 'compare'])).toThrow(/--a and --b/);
    expect(() => parseCompareArgs(['node', 'compare', '--a', 'x.json', '--bogus'])).toThrow(
      /unknown option/,
    );
    const args = parseCompareArgs(['node', 'compare', '--a', 'x.json', '--b', 'y.json']);
    expect(args).toMatchObject({ a: 'x.json', b: 'y.json' });
  });
});
