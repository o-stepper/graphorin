import { describe, expect, it } from 'vitest';

import { countTokensHeuristic, truncateBody } from '../src/result/index.js';

describe('truncateBody', () => {
  it('returns the body untouched when under the cap', async () => {
    const result = await truncateBody({
      body: 'short body',
      maxTokens: 10,
      strategy: 'middle',
    });
    expect(result.truncated).toBe(false);
    expect(result.body).toBe('short body');
  });

  it("'middle' truncation preserves head and tail with annotation in the middle", async () => {
    const body = 'A'.repeat(2000) + 'MIDDLE' + 'B'.repeat(2000);
    const result = await truncateBody({
      body,
      maxTokens: 100,
      strategy: 'middle',
    });
    expect(result.truncated).toBe(true);
    expect(result.body).toMatch(/^A+/);
    expect(result.body).toMatch(/B+$/);
    expect(result.body).toContain('graphorin:result:truncated');
    expect(result.body).toContain('strategy=middle');
  });

  it("'tail' truncation preserves the tail and inserts annotation at the head", async () => {
    const body = 'A'.repeat(2000) + 'TAIL_MARKER';
    const result = await truncateBody({
      body,
      maxTokens: 50,
      strategy: 'tail',
    });
    expect(result.truncated).toBe(true);
    expect(result.body.startsWith('/* graphorin:result:truncated')).toBe(true);
    expect(result.body).toMatch(/TAIL_MARKER$/);
  });

  it("'spill-to-file' falls back to 'middle' when no spill writer is configured", async () => {
    const body = 'A'.repeat(2000);
    const result = await truncateBody({
      body,
      maxTokens: 50,
      strategy: 'spill-to-file',
    });
    expect(result.strategyApplied).toBe('middle');
    expect(result.truncated).toBe(true);
  });

  it("'summarize' falls back to 'middle' when no summarizer is configured", async () => {
    const body = 'A'.repeat(2000);
    const result = await truncateBody({
      body,
      maxTokens: 50,
      strategy: 'summarize',
    });
    expect(result.strategyApplied).toBe('middle');
    expect(result.truncated).toBe(true);
  });

  it("'spill-to-file' writes through the supplied writer", async () => {
    let captured: { runId: string; toolCallId: string; bytes: number } | null = null;
    const result = await truncateBody({
      body: 'A'.repeat(2000),
      maxTokens: 50,
      strategy: 'spill-to-file',
      options: {
        runId: 'run-1',
        toolCallId: 'call-1',
        spill: {
          artifactRoot: '/tmp/graphorin',
          async write(opts) {
            captured = { runId: opts.runId, toolCallId: opts.toolCallId, bytes: opts.body.length };
            return {
              path: `/tmp/graphorin/${opts.runId}/${opts.toolCallId}.${opts.extension}`,
              bytes: opts.body.length,
            };
          },
        },
      },
    });
    expect(captured).not.toBeNull();
    expect(captured!.runId).toBe('run-1');
    expect(captured!.toolCallId).toBe('call-1');
    expect(result.strategyApplied).toBe('spill-to-file');
    expect(result.artifactPath).toMatch(/^\/tmp\/graphorin\/run-1\/call-1\./);
    // WI-10: the model-facing body carries the opaque, run-scoped handle —
    // not the raw absolute path (which is retained only on the outcome for
    // the operator audit row).
    expect(result.resultHandle).toBe('graphorin-spill:run-1/call-1.txt');
    expect(result.body).toContain(result.resultHandle!);
    expect(result.body).not.toContain(result.artifactPath!);
  });

  it("'summarize' invokes the supplied summarizer", async () => {
    const result = await truncateBody({
      body: 'A'.repeat(2000),
      maxTokens: 50,
      strategy: 'summarize',
      options: {
        summarizer: {
          model: 'fake-summarizer',
          async summarize() {
            return 'tiny summary';
          },
        },
      },
    });
    expect(result.strategyApplied).toBe('summarize');
    expect(result.summarizerModel).toBe('fake-summarizer');
    expect(result.body).toContain('tiny summary');
  });

  it('cap=0 disables truncation', async () => {
    const body = 'A'.repeat(10_000);
    const result = await truncateBody({
      body,
      maxTokens: 0,
      strategy: 'middle',
    });
    expect(result.truncated).toBe(false);
    expect(result.body).toBe(body);
  });

  it('truncation annotation does not match imperative-pattern catalogue', async () => {
    // The annotation prefix is `/* graphorin:result:truncated` — not in
    // the imperative-pattern family. Verify by importing the scan helper
    // and confirming zero hits on the annotation alone.
    const { scanImperativePatterns } = await import('@graphorin/observability/redaction');
    const result = await truncateBody({
      body: 'B'.repeat(2000),
      maxTokens: 30,
      strategy: 'middle',
    });
    const scan = scanImperativePatterns(result.body);
    // Match count should be zero for a body that doesn't contain
    // imperative content beyond the annotation.
    expect(scan?.hits ?? []).toHaveLength(0);
  });

  it('heuristic counter is 4 chars per token', () => {
    expect(countTokensHeuristic.count('1234')).toBe(1);
    expect(countTokensHeuristic.count('12345678')).toBe(2);
    expect(countTokensHeuristic.count('')).toBe(0);
  });
});
