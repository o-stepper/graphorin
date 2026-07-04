import { describe, expect, it } from 'vitest';

import {
  mean,
  pairedPassSignificance,
  passByBaseCase,
  passHatK,
  sampleStddev,
  stripIterationSuffix,
  wilsonInterval,
} from '../src/stats.js';

describe('stats (E8): mean / stddev', () => {
  it('mean of empty is 0; sample stddev needs n >= 2', () => {
    expect(mean([])).toBe(0);
    expect(sampleStddev([])).toBe(0);
    expect(sampleStddev([5])).toBe(0);
  });

  it('matches hand-computed values', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    // sample variance of [2,4,4,4,5,5,7,9] = 32/7
    expect(sampleStddev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(Math.sqrt(32 / 7), 10);
  });
});

describe('stats (E8): Wilson interval', () => {
  it('degenerate inputs', () => {
    expect(wilsonInterval(0, 0)).toEqual({ lo: 0, hi: 1 });
  });

  it('matches the textbook value for 8/10 at 95%', () => {
    const { lo, hi } = wilsonInterval(8, 10);
    // Known Wilson 95% interval for p-hat=0.8, n=10: about [0.490, 0.943].
    expect(lo).toBeCloseTo(0.49, 2);
    expect(hi).toBeCloseTo(0.943, 2);
  });

  it('is sane at the edges (all pass / all fail)', () => {
    const allPass = wilsonInterval(20, 20);
    expect(allPass.hi).toBeCloseTo(1, 10);
    expect(allPass.lo).toBeGreaterThan(0.8);
    const allFail = wilsonInterval(0, 20);
    expect(allFail.lo).toBeCloseTo(0, 10);
    expect(allFail.hi).toBeLessThan(0.2);
  });

  it('narrows with sample size', () => {
    const small = wilsonInterval(8, 10);
    const large = wilsonInterval(800, 1000);
    expect(large.hi - large.lo).toBeLessThan(small.hi - small.lo);
  });
});

describe('stats (E8): pass^k over -iter-N outcomes', () => {
  it('strips only the runner iteration suffix', () => {
    expect(stripIterationSuffix('case-3-iter-1')).toBe('case-3');
    expect(stripIterationSuffix('my-id')).toBe('my-id');
    expect(stripIterationSuffix('literal-iter-x')).toBe('literal-iter-x');
  });

  it('a case that flips across iterations fails pass^k but not the mean rate', () => {
    const outcomes = [
      { caseId: 'a-iter-0', pass: true },
      { caseId: 'a-iter-1', pass: false },
      { caseId: 'b-iter-0', pass: true },
      { caseId: 'b-iter-1', pass: true },
    ];
    const out = passHatK(outcomes);
    expect(out).toEqual({ k: 2, baseCases: 2, value: 0.5 });
  });

  it('k=1 single-shot run reduces to the plain pass rate', () => {
    const out = passHatK([
      { caseId: 'a', pass: true },
      { caseId: 'b', pass: false },
    ]);
    expect(out).toEqual({ k: 1, baseCases: 2, value: 0.5 });
  });

  it('empty input', () => {
    expect(passHatK([])).toEqual({ k: 0, baseCases: 0, value: 0 });
  });
});

describe('stats (E8): paired McNemar significance', () => {
  const asMap = (entries: ReadonlyArray<readonly [string, boolean]>) => new Map(entries);

  it('identical outcomes are never significant', () => {
    const cur = asMap([
      ['a', true],
      ['b', false],
    ]);
    const out = pairedPassSignificance(cur, cur);
    expect(out.pairs).toBe(2);
    expect(out.pValue).toBe(1);
  });

  it('one regressed case in a small suite is NOT significant', () => {
    const baseline = asMap([
      ['a', true],
      ['b', true],
      ['c', true],
      ['d', true],
    ]);
    const current = asMap([
      ['a', false],
      ['b', true],
      ['c', true],
      ['d', true],
    ]);
    const out = pairedPassSignificance(current, baseline);
    expect(out.regressed).toBe(1);
    expect(out.improved).toBe(0);
    expect(out.pValue).toBeGreaterThan(0.05);
  });

  it('many one-sided regressions ARE significant', () => {
    const baseline = new Map<string, boolean>();
    const current = new Map<string, boolean>();
    for (let i = 0; i < 30; i++) {
      baseline.set(`case-${i}`, true);
      current.set(`case-${i}`, i < 12 ? false : true); // 12 regressions, 0 improvements
    }
    const out = pairedPassSignificance(current, baseline);
    expect(out.regressed).toBe(12);
    expect(out.pValue).toBeLessThan(0.01);
  });

  it('unpaired cases are ignored', () => {
    const baseline = asMap([
      ['a', true],
      ['only-baseline', true],
    ]);
    const current = asMap([
      ['a', true],
      ['only-current', false],
    ]);
    expect(pairedPassSignificance(current, baseline).pairs).toBe(1);
  });

  it('passByBaseCase ANDs iterations into the paired unit', () => {
    const collapsed = passByBaseCase([
      { caseId: 'a-iter-0', pass: true },
      { caseId: 'a-iter-1', pass: false },
      { caseId: 'b-iter-0', pass: true },
      { caseId: 'b-iter-1', pass: true },
    ]);
    expect(collapsed.get('a')).toBe(false);
    expect(collapsed.get('b')).toBe(true);
  });
});
