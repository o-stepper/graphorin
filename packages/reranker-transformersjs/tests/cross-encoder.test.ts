import { describe, expect, it } from 'vitest';

import { CrossEncoderLoadError, extractPairScores } from '../src/cross-encoder.js';

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
});

describe('CrossEncoderLoadError', () => {
  it('captures the underlying cause', () => {
    const cause = new Error('underlying');
    const err = new CrossEncoderLoadError('boom', { cause });
    expect(err.name).toBe('CrossEncoderLoadError');
    expect(err.cause).toBe(cause);
  });
});
