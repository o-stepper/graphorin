import { describe, expect, it } from 'vitest';

import { createLlmReranker, mergeAndDedupe, RERANKER_ID } from '../src/reranker.js';

import { buildStubProvider, hit } from './_fixtures.js';

/** Extracts the first text block from a string-or-blocks message content. */
function firstText(content: unknown): string {
  const m = Array.isArray(content) ? (content[0] as unknown) : undefined;
  return typeof m === 'object' && m !== null && 'text' in m
    ? String((m as { text: unknown }).text)
    : '';
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

describe('createLlmReranker', () => {
  it('rejects invalid maxScore / batchSize at construction', () => {
    const { provider } = buildStubProvider(() => '7');
    expect(() => createLlmReranker({ provider, maxScore: 0 })).toThrow(/maxScore/);
    expect(() => createLlmReranker({ provider, maxScore: -1 })).toThrow(/maxScore/);
    expect(() => createLlmReranker({ provider, batchSize: 0 })).toThrow(/batchSize/);
    expect(() => createLlmReranker({ provider, batchSize: 1.5 })).toThrow(/batchSize/);
  });

  it('publishes the canonical id', () => {
    const { provider } = buildStubProvider(() => '0');
    const reranker = createLlmReranker({ provider });
    expect(reranker.id).toBe(RERANKER_ID);
  });

  it('returns an empty array when every input list is empty', async () => {
    const { provider, calls } = buildStubProvider(() => '0');
    const reranker = createLlmReranker({ provider });
    const result = await reranker.rerank('q', [[], []]);
    expect(result).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it('reranks across multiple input lists and returns the topK by LLM score', async () => {
    const scores: Record<string, string> = {
      'apple pie': '9',
      'banana bread': '4',
      'cherry cobbler': '7',
    };
    const { provider, calls } = buildStubProvider((req) => {
      const text = firstText(req.messages[0]?.content);
      const passage = Object.keys(scores).find((p) => text.includes(p));
      return passage !== undefined ? (scores[passage] as string) : '0';
    });
    const reranker = createLlmReranker({ provider });
    const lists = [
      [hit('r1', 'apple pie', 0.6), hit('r2', 'banana bread', 0.5)],
      [hit('r3', 'cherry cobbler', 0.55), hit('r1', 'apple pie', 0.7)],
    ];
    const result = await reranker.rerank('what dessert pairs with coffee?', lists, {
      topK: 2,
    });
    expect(result).toHaveLength(2);
    expect(result[0]?.record.id).toBe('r1');
    expect(result[0]?.score).toBeCloseTo(0.9);
    expect(result[1]?.record.id).toBe('r3');
    expect(result[1]?.score).toBeCloseTo(0.7);
    expect(calls).toHaveLength(3);
    expect(reranker.lastPromptTokens).toBe(300);
  });

  it('attaches llm_score + llm_score_norm signals', async () => {
    const { provider } = buildStubProvider(() => '8');
    const reranker = createLlmReranker({ provider });
    const result = await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    expect(result[0]?.signals).toMatchObject({
      vector: 0.5,
      llm_score: 8,
      llm_score_norm: 0.8,
    });
  });

  it('falls back to fallbackScore when the model emits unparseable text', async () => {
    const { provider } = buildStubProvider(() => 'I cannot rate this');
    const reranker = createLlmReranker({ provider, fallbackScore: 0.25 });
    const result = await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    expect(result[0]?.score).toBeCloseTo(0.25);
  });

  it('honours an aborted AbortSignal before the first batch', async () => {
    const controller = new AbortController();
    controller.abort();
    const { provider } = buildStubProvider(() => '7');
    const reranker = createLlmReranker({ provider });
    await expect(
      reranker.rerank('q', [[hit('r1', 'apple', 0.5)]], { signal: controller.signal }),
    ).rejects.toThrow(/aborted/);
  });

  it('honours an aborted AbortSignal between batches', async () => {
    const controller = new AbortController();
    let scoreCalls = 0;
    const { provider } = buildStubProvider(() => {
      scoreCalls += 1;
      if (scoreCalls === 1) controller.abort();
      return '5';
    });
    const reranker = createLlmReranker({ provider, batchSize: 1 });
    await expect(
      reranker.rerank('q', [[hit('r1', 'a', 0.1), hit('r2', 'b', 0.2)]], {
        signal: controller.signal,
      }),
    ).rejects.toThrow(/aborted/);
  });

  it('respects custom temperature + maxOutputTokens forwarded to the provider', async () => {
    const { provider, calls } = buildStubProvider(() => '5');
    const reranker = createLlmReranker({
      provider,
      temperature: 0.3,
      maxOutputTokens: 4,
    });
    await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    expect(calls[0]?.request.temperature).toBe(0.3);
    expect(calls[0]?.request.maxTokens).toBe(4);
  });

  it('uses a custom scoringPrompt when provided', async () => {
    const { provider, calls } = buildStubProvider(() => '7');
    const reranker = createLlmReranker({
      provider,
      scoringPrompt: ({ query, passage, maxScore }) => ({
        system: `CUSTOM SYSTEM ${maxScore}`,
        user: `Q=${query} P=${passage}`,
      }),
    });
    await reranker.rerank('lisbon', [[hit('r1', 'a passage', 0.5)]]);
    expect(calls[0]?.request.systemMessage).toBe('CUSTOM SYSTEM 10');
    const userText = firstText(calls[0]?.request.messages[0]?.content);
    expect(userText).toBe('Q=lisbon P=a passage');
  });

  it('uses a custom passageExtractor when provided', async () => {
    const { provider, calls } = buildStubProvider(() => '7');
    const reranker = createLlmReranker({
      provider,
      passageExtractor: (record) => `EXTRACTED:${(record as { text?: string }).text ?? ''}`,
    });
    await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    const text = firstText(calls[0]?.request.messages[0]?.content);
    expect(text).toContain('EXTRACTED:apple');
  });

  it('forwards the sensitivityFloor through providerOptions', async () => {
    const { provider, calls } = buildStubProvider(() => '5');
    const reranker = createLlmReranker({ provider, sensitivityFloor: 'internal' });
    await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    expect(calls[0]?.request.providerOptions).toMatchObject({
      reranker_sensitivity_floor: 'internal',
    });
  });

  it('counts invocations across rerank calls', async () => {
    const { provider } = buildStubProvider(() => '5');
    const reranker = createLlmReranker({ provider });
    expect(reranker.invocationCount).toBe(0);
    await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    expect(reranker.invocationCount).toBe(1);
    await reranker.rerank('q', [[hit('r1', 'apple', 0.5)]]);
    expect(reranker.invocationCount).toBe(2);
  });

  it('runs in parallel batches respecting batchSize', async () => {
    const { provider, calls } = buildStubProvider(() => '5');
    const reranker = createLlmReranker({ provider, batchSize: 2 });
    const lists = [
      [
        hit('r1', 'a', 0.1),
        hit('r2', 'b', 0.2),
        hit('r3', 'c', 0.3),
        hit('r4', 'd', 0.4),
        hit('r5', 'e', 0.5),
      ],
    ];
    await reranker.rerank('q', lists);
    // 5 candidates, batchSize 2 → 5 individual provider calls (the
    // batches are concurrency-2 not size-2).
    expect(calls).toHaveLength(5);
  });
});
