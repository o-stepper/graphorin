import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/memory-graph-recall`. Every test runs
 * against `:memory:` SQLite, the deterministic hash stub embedder, and
 * the scripted grader provider, so CI never touches a network socket
 * or downloads a model. The scenarios cover:
 *
 *  1. Canonical version constant.
 *  2. The full five-stage flow: graph-hop recall finds the
 *     cross-entity fact (and names the linking entity), the graded
 *     deep-recall loop answers one question and ABSTAINS on the
 *     unanswerable one, the quarantined fact is hidden from default
 *     recall then recallable after `semantic.validate`, and the
 *     promoted insight is readable through the insights read tier.
 *  3. `main()` exits 0 and its final stdout line is the
 *     `memory-graph-recall: OK ...` stats line.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { main, runMemoryGraphRecall, VERSION } from '../src/main.js';

describe('examples/memory-graph-recall - smoke', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes the package.json version', () => {
    expect(VERSION).toBe(pkgVersion);
  });

  it('runs the five-stage flow with deterministic outcomes', async () => {
    const lines: string[] = [];
    const result = await runMemoryGraphRecall({ log: (line) => lines.push(line) });

    // Stage 1 - store + graph write path.
    expect(result.factsStored).toBe(7);
    expect(result.entities).toContain('Marta');
    expect(result.entities).toContain('Horizon Labs');
    expect(result.entities.length).toBe(8);

    // Stage 2 - graph-hop recall found the cross-entity fact.
    expect(result.hopRecall.baselineMissed).toBe(true);
    expect(result.hopRecall.expandedHit).toBe(true);
    expect(result.hopRecall.graphLegOnly).toBe(true);
    expect(result.hopRecall.linkedVia).toBe('Horizon Labs');

    // Stage 3 - graded loop answered, then abstained (no confabulation).
    expect(result.deepRecall.answered.sufficient).toBe(true);
    expect(result.deepRecall.answered.graded).toBe(true);
    expect(result.deepRecall.answered.abstained).toBe(false);
    expect(result.deepRecall.answered.iterations).toBe(1);
    expect(result.deepRecall.unanswerable.abstained).toBe(true);
    expect(result.deepRecall.unanswerable.graded).toBe(true);
    expect(result.deepRecall.unanswerable.sufficient).toBe(false);
    expect(result.deepRecall.unanswerable.iterations).toBe(2);
    expect(result.deepRecall.unanswerable.queries.length).toBe(2);
    expect(result.deepRecall.gradeCalls).toBe(3);

    // Stage 4 - quarantined fact hidden, then visible after validate.
    expect(result.quarantine.bornQuarantined).toBe(true);
    expect(result.quarantine.quarantineReason).toBe('synthesized');
    expect(result.quarantine.hiddenByDefault).toBe(true);
    expect(result.quarantine.visibleToInspector).toBe(true);
    expect(result.quarantine.recallableAfterValidate).toBe(true);

    // Stage 5 - insight readable through the read tier after promotion.
    expect(result.insight.hiddenWhileQuarantined).toBe(true);
    expect(result.insight.readableAfterValidate).toBe(true);
    expect(result.insight.searchHit).toBe(true);

    // The gated deep_recall tool registered on top of the canonical 11.
    expect(result.toolCount).toBe(12);

    // One concise summary line per stage.
    expect(lines).toHaveLength(5);
    expect(result.summaryLine).toContain('memory-graph-recall: OK');
    expect(result.summaryLine).toContain('abstained=yes');
    expect(result.summaryLine).toContain('quarantinePromoted=yes');
  }, 30_000);

  it('main() exits 0 and prints the memory-graph-recall: OK line last', async () => {
    const chunks: string[] = [];
    const spy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation((chunk: string | Uint8Array): boolean => {
        chunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
        return true;
      });
    try {
      const exitCode = await main({ env: {} });
      expect(exitCode).toBe(0);
    } finally {
      spy.mockRestore();
    }
    const outLines = chunks
      .join('')
      .split('\n')
      .filter((line) => line.length > 0);
    const finalLine = outLines[outLines.length - 1];
    expect(finalLine).toMatch(/^memory-graph-recall: OK /);
    expect(finalLine).toContain('facts=7');
    expect(finalLine).toContain('entities=8');
    expect(finalLine).toContain('hopRecallHit=yes');
    expect(finalLine).toContain('abstained=yes');
    expect(finalLine).toContain('quarantinePromoted=yes');
    expect(finalLine).toContain('insightReadable=yes');
  }, 30_000);
});
