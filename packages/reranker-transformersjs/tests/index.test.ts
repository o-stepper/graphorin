import { describe, expect, it } from 'vitest';

import * as pkg from '../src/index.js';

describe('@graphorin/reranker-transformersjs public surface', () => {
  it('declares the canonical version constant', () => {
    expect(pkg.VERSION).toBe('0.1.0');
  });

  it('re-exports the reranker factory + class + id', () => {
    expect(typeof pkg.createCrossEncoderReranker).toBe('function');
    expect(pkg.RERANKER_ID).toBe('transformersjs-cross-encoder');
    expect(typeof pkg.TransformersJsReRanker).toBe('function');
    expect(typeof pkg.mergeAndDedupe).toBe('function');
  });

  it('re-exports the locale-aware model selector', () => {
    expect(pkg.DEFAULT_ENGLISH_MODEL).toBe('Xenova/bge-reranker-base');
    expect(pkg.DEFAULT_MULTILINGUAL_MODEL).toBe('BAAI/bge-reranker-v2-m3');
    expect(typeof pkg.pickRerankerModel).toBe('function');
  });

  it('re-exports the cross-encoder helpers', () => {
    expect(typeof pkg.extractPairScores).toBe('function');
    expect(typeof pkg.loadDefaultPipelineFactory).toBe('function');
    expect(typeof pkg.CrossEncoderLoadError).toBe('function');
    expect(typeof pkg._resetPipelineFactoryCacheForTesting).toBe('function');
  });

  it('re-exports the default passage extractor', () => {
    expect(typeof pkg.defaultPassageExtractor).toBe('function');
  });
});
