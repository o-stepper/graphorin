import { describe, expect, it } from 'vitest';

import * as pkg from '../src/index.js';

describe('@graphorin/evals public surface', () => {
  it('declares the canonical version constant', () => {
    expect(pkg.VERSION).toBe('0.1.0');
  });

  it('re-exports the parallel runner', () => {
    expect(typeof pkg.runEvals).toBe('function');
  });

  it('re-exports every shipped scorer', () => {
    expect(typeof pkg.exactMatch).toBe('function');
    expect(typeof pkg.regexMatch).toBe('function');
    expect(typeof pkg.jsonPath).toBe('function');
    expect(typeof pkg.predicate).toBe('function');
    expect(typeof pkg.llmJudge).toBe('function');
    expect(typeof pkg.toxicityScorer).toBe('function');
    expect(typeof pkg.factualityScorer).toBe('function');
    expect(typeof pkg.helpfulnessScorer).toBe('function');
  });

  it('re-exports every shipped loader', () => {
    expect(typeof pkg.loadJsonlDataset).toBe('function');
    expect(typeof pkg.loadCsvDataset).toBe('function');
    expect(typeof pkg.loadDatasetFromTraces).toBe('function');
    expect(typeof pkg.fromIterable).toBe('function');
    expect(typeof pkg.parseJsonl).toBe('function');
    expect(typeof pkg.parseCsv).toBe('function');
  });

  it('re-exports every shipped reporter', () => {
    expect(typeof pkg.renderTerminalReport).toBe('function');
    expect(typeof pkg.renderMarkdownReport).toBe('function');
    expect(typeof pkg.renderJsonReport).toBe('function');
    expect(typeof pkg.renderJunitReport).toBe('function');
    expect(typeof pkg.renderHtmlReport).toBe('function');
  });

  it('re-exports the CLI helpers + regression detector', () => {
    expect(typeof pkg.exitOnFailures).toBe('function');
    expect(typeof pkg.writeReports).toBe('function');
    expect(typeof pkg.detectRegressions).toBe('function');
    expect(typeof pkg.detectRegressionsFromReports).toBe('function');
  });
});
