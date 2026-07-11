import { describe, expect, it } from 'vitest';

import {
  CrossEncoderLoadError,
  defaultRerankerDtype,
  extractPairScores,
  scoresFromLogits,
} from '../src/cross-encoder.js';

describe('extractPairScores', () => {
  it('handles single-best per pair shape', () => {
    const raw = [
      { label: 'POSITIVE', score: 0.9 },
      { label: 'NEGATIVE', score: 0.1 },
    ];
    expect(extractPairScores(raw, 2)).toEqual([0.9, 0.1]);
  });

  it('picks the best label score from per-pair arrays', () => {
    const raw = [
      [
        { label: 'A', score: 0.2 },
        { label: 'B', score: 0.8 },
      ],
      [
        { label: 'A', score: 0.6 },
        { label: 'B', score: 0.3 },
      ],
    ];
    expect(extractPairScores(raw, 2)).toEqual([0.8, 0.6]);
  });

  it('returns 0 for empty / missing entries', () => {
    expect(extractPairScores([] as never, 2)).toEqual([0, 0]);
    expect(extractPairScores([[]] as never, 1)).toEqual([0]);
  });

  it('reads the POSITIVE label score for a 2-label classifier, not the max (PS-16)', () => {
    const raw = [
      // An irrelevant pair: the model is confident it's the NEGATIVE class.
      [
        { label: 'LABEL_0', score: 0.95 },
        { label: 'LABEL_1', score: 0.05 },
      ],
      // A relevant pair.
      [
        { label: 'LABEL_0', score: 0.2 },
        { label: 'LABEL_1', score: 0.8 },
      ],
    ];
    // The relevance score is the positive (LABEL_1) confidence, so the
    // irrelevant pair scores low - not 0.95.
    expect(extractPairScores(raw, 2)).toEqual([0.05, 0.8]);
  });

  it('matches positive/relevant word labels without the "irrelevant" false-match (PS-16)', () => {
    const raw = [
      [
        { label: 'irrelevant', score: 0.9 },
        { label: 'relevant', score: 0.1 },
      ],
    ];
    expect(extractPairScores(raw, 1)).toEqual([0.1]); // 'relevant', not 'irrelevant'
  });
});

describe('defaultRerankerDtype', () => {
  it("defaults to 'q8' on the CPU device (N-01/22: fp16 fails onnxruntime-node session init)", () => {
    expect(defaultRerankerDtype(undefined)).toBe('q8');
    expect(defaultRerankerDtype('cpu')).toBe('q8');
  });

  it("keeps 'fp16' for accelerated devices", () => {
    expect(defaultRerankerDtype('webgpu')).toBe('fp16');
    expect(defaultRerankerDtype('dml')).toBe('fp16');
  });
});

describe('scoresFromLogits', () => {
  it('sigmoids single-logit heads instead of softmaxing them to a constant 1.0 (N-01/23)', () => {
    // bge-reranker-base shape: dims [batch, 1], one raw logit per pair.
    const relevant = 0.74;
    const irrelevant = -10.18;
    const scores = scoresFromLogits([relevant, irrelevant], [2, 1], { '0': 'LABEL_0' }, 2);
    expect(scores[0]).toBeCloseTo(1 / (1 + Math.exp(-relevant)), 6);
    expect(scores[1]).toBeCloseTo(1 / (1 + Math.exp(-irrelevant)), 6);
    // The regression: the pipeline path returned 1.0 for BOTH pairs.
    expect(scores[0]).toBeGreaterThan(scores[1] ?? Number.NaN);
    expect(new Set(scores).size).toBe(2);
  });

  it('reads the positive label probability for multi-logit heads via id2label', () => {
    // Row softmax([1, 3]) = [~0.119, ~0.881]; positive class at index 0.
    const scores = scoresFromLogits([1, 3], [1, 2], { '0': 'relevant', '1': 'irrelevant' }, 1);
    expect(scores[0]).toBeCloseTo(Math.exp(1) / (Math.exp(1) + Math.exp(3)), 6);
  });

  it('falls back to index 1 for unlabeled binary heads (LABEL_0/LABEL_1 convention)', () => {
    const scores = scoresFromLogits([3, 1], [1, 2], undefined, 1);
    expect(scores[0]).toBeCloseTo(Math.exp(1) / (Math.exp(1) + Math.exp(3)), 6);
  });

  it('falls back to the max probability when no label is recognisably positive (>2 labels)', () => {
    const scores = scoresFromLogits([0, 2, 1], [1, 3], { '0': 'a', '1': 'b', '2': 'c' }, 1);
    const sum = Math.exp(0) + Math.exp(2) + Math.exp(1);
    expect(scores[0]).toBeCloseTo(Math.exp(2) / sum, 6);
  });

  it('zero-fills pairs missing from a short logits buffer', () => {
    expect(scoresFromLogits([0.5], [2, 1], undefined, 2)).toEqual([1 / (1 + Math.exp(-0.5)), 0]);
  });
});

describe('CrossEncoderLoadError', () => {
  it('captures the underlying cause', () => {
    const cause = new Error('underlying');
    const err = new CrossEncoderLoadError('boom', { cause });
    expect(err.name).toBe('CrossEncoderLoadError');
    expect(err.cause).toBe(cause);
  });
});
