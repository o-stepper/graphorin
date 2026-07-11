import { describe, expect, it, vi } from 'vitest';

import type {
  ClassifierResult,
  CrossEncoderPipeline,
  CrossEncoderPipelineFactory,
} from '../src/cross-encoder.js';
import {
  createCrossEncoderReranker,
  DEFAULT_ENGLISH_MODEL,
  DEFAULT_MULTILINGUAL_MODEL,
  mergeAndDedupe,
  RERANKER_ID,
} from '../src/reranker.js';

import { hit } from './_fixtures.js';

interface CallTrace {
  readonly task: string;
  readonly model: string;
  readonly options: Readonly<Record<string, unknown>>;
  readonly pairs: ReadonlyArray<{ text: string; text_pair: string }>;
}

function buildStubFactory(scores: Map<string, number>): {
  factory: CrossEncoderPipelineFactory;
  calls: CallTrace[];
} {
  const calls: CallTrace[] = [];
  const factory: CrossEncoderPipelineFactory = async (task, model, options) => {
    const pipeline: CrossEncoderPipeline = async (pairs) => {
      calls.push({
        task,
        model,
        options: options as never,
        pairs: pairs.map((p) => ({ text: p.text, text_pair: p.text_pair })),
      });
      const out: ClassifierResult[] = pairs.map((pair) => {
        const score = scores.get(pair.text_pair) ?? 0;
        return { label: 'POSITIVE', score };
      });
      return out;
    };
    return pipeline;
  };
  return { factory, calls };
}

describe('mergeAndDedupe', () => {
  it('keeps the highest score per record id and preserves first-seen order', () => {
    const a = hit('r1', 'apple', 0.5);
    const aBetter = hit('r1', 'apple', 0.9);
    const b = hit('r2', 'banana', 0.4);
    const merged = mergeAndDedupe([[a, b], [aBetter]]);
    expect(merged).toHaveLength(2);
    expect(merged[0]?.hit.record.id).toBe('r1');
    expect(merged[0]?.hit.score).toBe(0.9);
    expect(merged[1]?.hit.record.id).toBe('r2');
  });
});

describe('createCrossEncoderReranker', () => {
  it("auto-picks the English model for locale: 'en'", () => {
    const reranker = createCrossEncoderReranker({ locale: 'en' });
    expect(reranker.model).toBe(DEFAULT_ENGLISH_MODEL);
    expect(reranker.id).toBe(RERANKER_ID);
  });

  it('auto-picks the multilingual model for non-English locales', () => {
    const reranker = createCrossEncoderReranker({ locale: 'pt-BR' });
    expect(reranker.model).toBe(DEFAULT_MULTILINGUAL_MODEL);
  });

  it('honours an explicit model override', () => {
    const reranker = createCrossEncoderReranker({
      model: 'cross-encoder/ms-marco-MiniLM-L-6-v2',
    });
    expect(reranker.model).toBe('cross-encoder/ms-marco-MiniLM-L-6-v2');
  });

  it("defaults dtype to 'q8' on the (default) CPU device (N-01/22 regression)", () => {
    expect(createCrossEncoderReranker({ locale: 'en' }).dtype).toBe('q8');
    expect(createCrossEncoderReranker({ locale: 'en', device: 'cpu' }).dtype).toBe('q8');
  });

  it("defaults dtype to 'fp16' on accelerated devices and honours explicit overrides", () => {
    expect(createCrossEncoderReranker({ locale: 'en', device: 'webgpu' }).dtype).toBe('fp16');
    expect(createCrossEncoderReranker({ locale: 'en', dtype: 'fp32' }).dtype).toBe('fp32');
  });

  it('passes the device-derived default dtype to an injected pipeline factory', async () => {
    const { factory, calls } = buildStubFactory(new Map([['apple', 0.7]]));
    const reranker = createCrossEncoderReranker({
      locale: 'en',
      pipelineFactory: factory,
    });
    await reranker.rerank('apple', [[hit('r1', 'apple', 0.9)]]);
    expect(calls[0]?.options).toMatchObject({ dtype: 'q8' });
  });

  it('applies the dtype / device / cacheDir / revision options when loading the pipeline', async () => {
    const { factory, calls } = buildStubFactory(new Map([['apple', 0.7]]));
    const reranker = createCrossEncoderReranker({
      locale: 'en',
      dtype: 'q8',
      device: 'webgpu',
      revision: 'main',
      cacheDir: '/tmp/test-cache',
      pipelineFactory: factory,
    });
    await reranker.rerank('apple', [[hit('r1', 'apple', 0.9)]]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.task).toBe('text-classification');
    expect(calls[0]?.options).toMatchObject({
      revision: 'main',
      cache_dir: '/tmp/test-cache',
      dtype: 'q8',
      device: 'webgpu',
    });
  });

  it('returns an empty array when every input list is empty', async () => {
    const { factory } = buildStubFactory(new Map());
    const reranker = createCrossEncoderReranker({
      locale: 'en',
      pipelineFactory: factory,
    });
    const result = await reranker.rerank('q', [[]]);
    expect(result).toEqual([]);
  });

  it('reranks across multiple input lists and returns the topK by cross-encoder score', async () => {
    const scores = new Map<string, number>([
      ['apple pie', 0.95],
      ['banana bread', 0.4],
      ['cherry cobbler', 0.7],
    ]);
    const { factory, calls } = buildStubFactory(scores);
    const reranker = createCrossEncoderReranker({
      locale: 'en',
      pipelineFactory: factory,
    });
    const lists = [
      [hit('r1', 'apple pie', 0.6), hit('r2', 'banana bread', 0.5)],
      [hit('r3', 'cherry cobbler', 0.55), hit('r1', 'apple pie', 0.7)],
    ];
    const result = await reranker.rerank('what dessert pairs with coffee?', lists, {
      topK: 2,
    });
    expect(result).toHaveLength(2);
    expect(result[0]?.record.id).toBe('r1');
    expect(result[0]?.score).toBeCloseTo(0.95);
    expect(result[1]?.record.id).toBe('r3');
    expect(result[1]?.score).toBeCloseTo(0.7);
    expect(result[0]?.signals?.cross_encoder).toBeCloseTo(0.95);
    expect(calls[0]?.pairs).toHaveLength(3);
  });

  it('attaches cross_encoder signal alongside any pre-existing signals', async () => {
    const { factory } = buildStubFactory(new Map([['apple', 0.8]]));
    const reranker = createCrossEncoderReranker({
      locale: 'en',
      pipelineFactory: factory,
    });
    const result = await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    expect(result[0]?.signals).toEqual({ vector: 0.5, cross_encoder: 0.8 });
  });

  it('honours an AbortSignal that aborts before the pipeline call', async () => {
    const controller = new AbortController();
    controller.abort();
    const { factory } = buildStubFactory(new Map([['apple', 0.8]]));
    const reranker = createCrossEncoderReranker({
      locale: 'en',
      pipelineFactory: factory,
    });
    await expect(
      reranker.rerank('q', [[hit('r1', 'apple', 0.5)]], { signal: controller.signal }),
    ).rejects.toThrow(/aborted/);
  });

  it('honours an AbortSignal that aborts mid-batch', async () => {
    const controller = new AbortController();
    let calls = 0;
    const factory: CrossEncoderPipelineFactory = async () => {
      const pipeline: CrossEncoderPipeline = async (pairs) => {
        calls += 1;
        if (calls === 1) controller.abort();
        return pairs.map(() => ({ label: 'POSITIVE', score: 0.5 }));
      };
      return pipeline;
    };
    const reranker = createCrossEncoderReranker({
      locale: 'en',
      pipelineFactory: factory,
      batchSize: 1,
    });
    await expect(
      reranker.rerank('q', [[hit('r1', 'a', 0.1), hit('r2', 'b', 0.2)]], {
        signal: controller.signal,
      }),
    ).rejects.toThrow(/aborted/);
  });

  it('counts invocations + reports pipelineLoaded after first rerank', async () => {
    const { factory } = buildStubFactory(new Map([['apple', 0.8]]));
    const reranker = createCrossEncoderReranker({
      locale: 'en',
      pipelineFactory: factory,
    });
    expect(reranker.invocationCount).toBe(0);
    expect(reranker.pipelineLoaded).toBe(false);
    await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    expect(reranker.invocationCount).toBe(1);
    expect(reranker.pipelineLoaded).toBe(true);
    await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    expect(reranker.invocationCount).toBe(2);
  });

  it('drops the loaded pipeline on unload()', async () => {
    const { factory } = buildStubFactory(new Map([['apple', 0.8]]));
    const reranker = createCrossEncoderReranker({
      locale: 'en',
      pipelineFactory: factory,
    });
    await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    expect(reranker.pipelineLoaded).toBe(true);
    reranker.unload();
    expect(reranker.pipelineLoaded).toBe(false);
  });

  it('drops the pipeline after the idle-eviction timeout fires', async () => {
    vi.useFakeTimers();
    try {
      const { factory } = buildStubFactory(new Map([['apple', 0.8]]));
      const reranker = createCrossEncoderReranker({
        locale: 'en',
        pipelineFactory: factory,
        idleEvictionMs: 5_000,
      });
      await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
      expect(reranker.pipelineLoaded).toBe(true);
      vi.advanceTimersByTime(5_001);
      // The setTimeout body fires synchronously after `advanceTimersByTime`
      // - no further awaits needed.
      expect(reranker.pipelineLoaded).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('wraps pipeline-load failures in CrossEncoderLoadError', async () => {
    const factory: CrossEncoderPipelineFactory = async () => {
      throw new Error('model not found');
    };
    const reranker = createCrossEncoderReranker({
      locale: 'en',
      pipelineFactory: factory,
    });
    await expect(reranker.rerank('q', [[hit('r1', 'apple', 0.5)]])).rejects.toThrow(
      /failed to load model/,
    );
  });

  it('respects a custom passageExtractor', async () => {
    const { factory, calls } = buildStubFactory(new Map([['CUSTOM:apple', 0.8]]));
    const reranker = createCrossEncoderReranker({
      locale: 'en',
      pipelineFactory: factory,
      passageExtractor: (record) => `CUSTOM:${(record as { text?: string }).text ?? ''}`,
    });
    await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    expect(calls[0]?.pairs[0]?.text_pair).toBe('CUSTOM:apple');
  });
});
