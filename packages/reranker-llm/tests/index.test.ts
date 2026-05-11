import { describe, expect, it } from 'vitest';

import * as pkg from '../src/index.js';

describe('@graphorin/reranker-llm public surface', () => {
  it('declares the canonical version constant', () => {
    expect(pkg.VERSION).toBe('0.1.0');
  });

  it('re-exports the reranker factory + class + id', () => {
    expect(typeof pkg.createLlmReranker).toBe('function');
    expect(typeof pkg.LlmReRanker).toBe('function');
    expect(pkg.RERANKER_ID).toBe('llm-judge');
    expect(typeof pkg.mergeAndDedupe).toBe('function');
  });

  it('re-exports parser + normalizer helpers', () => {
    expect(typeof pkg.parseIntegerResponse).toBe('function');
    expect(typeof pkg.normalizeScore).toBe('function');
  });

  it('re-exports the default scoring prompt', () => {
    expect(typeof pkg.defaultScoringPrompt).toBe('function');
  });

  it('re-exports the default passage extractor', () => {
    expect(typeof pkg.defaultPassageExtractor).toBe('function');
  });
});
