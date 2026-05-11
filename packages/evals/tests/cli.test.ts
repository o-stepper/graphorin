import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { exitOnFailures, writeReports } from '../src/cli/index.js';
import type { EvalReport, RegressionReport } from '../src/types.js';

const REPORT: EvalReport<string, string> = {
  results: [
    {
      caseId: 'pass-1',
      input: 'q1',
      output: 'a1',
      durationMs: 50,
      scores: [{ scorer: 'em', result: { pass: true, score: 1 } }],
    },
    {
      caseId: 'fail-1',
      input: 'q2',
      output: 'wrong',
      durationMs: 60,
      scores: [{ scorer: 'em', result: { pass: false, score: 0, reason: 'mismatch' } }],
    },
  ],
  summary: {
    total: 2,
    passed: 1,
    failed: 1,
    avgDurationMs: 55,
    byScorer: Object.freeze({ em: { passed: 1, failed: 1, avgScore: 0.5 } }),
  },
};

let originalExitCode: number | undefined;

beforeEach(() => {
  originalExitCode = process.exitCode;
  process.exitCode = undefined;
});

afterEach(() => {
  process.exitCode = originalExitCode;
});

describe('exitOnFailures', () => {
  it('sets exitCode to 1 when failures exist', () => {
    exitOnFailures(REPORT);
    expect(process.exitCode).toBe(1);
  });

  it('does not set exitCode when there are no failures and no regressions', () => {
    const cleanReport: EvalReport<string, string> = {
      ...REPORT,
      summary: { ...REPORT.summary, failed: 0, passed: 2 },
    };
    exitOnFailures(cleanReport);
    expect(process.exitCode).toBeUndefined();
  });

  it('sets exitCode when a regression report flags issues', () => {
    const cleanReport: EvalReport<string, string> = {
      ...REPORT,
      summary: { ...REPORT.summary, failed: 0, passed: 2 },
    };
    const regression: RegressionReport<string, string> = {
      hasRegressions: true,
      findings: [{ kind: 'pass-rate-drop', message: 'drop', delta: -10 }],
      current: cleanReport,
      baseline: cleanReport,
    };
    exitOnFailures(cleanReport, regression);
    expect(process.exitCode).toBe(1);
  });
});

describe('writeReports', () => {
  it('writes every requested format to disk', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'graphorin-evals-cli-'));
    const written = await writeReports({
      report: REPORT,
      outDir: dir,
      formats: ['terminal', 'markdown', 'json', 'junit', 'html'],
      basename: 'sample',
    });
    expect(written).toHaveLength(5);
    const formats = new Set(written.map((w) => w.format));
    expect(formats).toEqual(new Set(['terminal', 'markdown', 'json', 'junit', 'html']));
    const md = readFileSync(join(dir, 'sample.md'), 'utf8');
    expect(md).toContain('graphorin/evals report');
    const xml = readFileSync(join(dir, 'sample.xml'), 'utf8');
    expect(xml).toContain('<testsuite');
    const html = readFileSync(join(dir, 'sample.html'), 'utf8');
    expect(html).toContain('<!DOCTYPE html>');
  });
});
