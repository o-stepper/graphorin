import { describe, expect, it } from 'vitest';

import {
  renderHtmlReport,
  renderJsonReport,
  renderJunitReport,
  renderMarkdownReport,
  renderTerminalReport,
} from '../src/reporters/index.js';
import type { EvalReport } from '../src/types.js';

const REPORT: EvalReport<string, string> = {
  results: [
    {
      caseId: 'pass-1',
      input: 'q1',
      output: 'a1',
      durationMs: 100,
      scores: [{ scorer: 'em', result: { pass: true, score: 1 } }],
    },
    {
      caseId: 'fail-1',
      input: 'q2',
      output: 'wrong',
      durationMs: 200,
      scores: [
        { scorer: 'em', result: { pass: false, score: 0, reason: "expected 'a2'" } },
        { scorer: 'judge', result: { pass: true, score: 0.8 } },
      ],
    },
  ],
  summary: {
    total: 2,
    passed: 1,
    failed: 1,
    avgDurationMs: 150,
    byScorer: Object.freeze({
      em: { passed: 1, failed: 1, avgScore: 0.5 },
      judge: { passed: 1, failed: 0, avgScore: 0.8 },
    }),
  },
};

describe('renderTerminalReport', () => {
  it('renders the summary + per-scorer + failures', () => {
    const out = renderTerminalReport(REPORT);
    expect(out).toContain('total:   2');
    expect(out).toContain('passed:  1');
    expect(out).toContain('failed:  1');
    expect(out).toContain('em');
    expect(out).toContain('judge');
    expect(out).toContain('fail-1');
    expect(out).toContain("expected 'a2'");
  });
});

describe('renderMarkdownReport', () => {
  it('renders summary + tables + failures', () => {
    const out = renderMarkdownReport(REPORT);
    expect(out).toContain('# graphorin/evals report');
    expect(out).toContain('| Total cases | 2 |');
    expect(out).toContain('| `em` | 1 | 1 | 0.5000 |');
    expect(out).toContain('### `fail-1`');
  });

  it('escapes pipes, backslashes and newlines in scorer reasons', () => {
    const adversarial: EvalReport<string, string> = {
      ...REPORT,
      results: [
        {
          caseId: 'fail-escape',
          input: 'q',
          output: 'a',
          durationMs: 1,
          scores: [
            {
              scorer: 'em',
              result: {
                pass: false,
                score: 0,
                reason: 'col-a | col-b\\ next-line\nrow-2',
              },
            },
          ],
        },
      ],
    };
    const out = renderMarkdownReport(adversarial);
    expect(out).toContain('col-a \\| col-b\\\\ next-line row-2');
    expect(out).not.toContain('col-a | col-b');
    expect(out).not.toMatch(/col-b\\ next-line/);
  });
});

describe('renderJsonReport', () => {
  it('emits valid pretty-printed JSON', () => {
    const out = renderJsonReport(REPORT, { pretty: true });
    const parsed = JSON.parse(out);
    expect(parsed.summary.total).toBe(2);
    expect(out).toContain('\n');
  });

  it('emits compact JSON when pretty is false', () => {
    const out = renderJsonReport(REPORT);
    expect(out).not.toContain('\n');
  });
});

describe('renderJunitReport', () => {
  it('emits a JUnit XML document with failures', () => {
    const out = renderJunitReport(REPORT, { suiteName: 'my-suite' });
    expect(out).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(out).toContain('name="my-suite"');
    expect(out).toContain('<failure');
    expect(out).toMatch(/expected &apos;a2&apos;/);
  });
});

describe('renderHtmlReport', () => {
  it('emits a self-contained HTML document', () => {
    const out = renderHtmlReport(REPORT, { title: 'Custom Title' });
    expect(out).toContain('<!DOCTYPE html>');
    expect(out).toContain('Custom Title');
    expect(out).toContain('Pass rate');
    expect(out).toContain('fail-1');
  });
});
