import type { Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  factualityScorer,
  helpfulnessScorer,
  llmJudge,
  toxicityScorer,
} from '../src/scorers/index.js';

function buildProvider(reply: string | ((req: ProviderRequest) => string)): Provider {
  return {
    name: 'stub',
    modelId: 'stub-judge',
    capabilities: {
      streaming: false,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 4096,
      maxOutput: 1024,
    },
    stream(): AsyncIterable<never> {
      throw new Error('not used');
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      const text = typeof reply === 'string' ? reply : reply(req);
      return {
        text,
        usage: { promptTokens: 10, completionTokens: 1, totalTokens: 11 },
        finishReason: 'stop',
      };
    },
  };
}

describe('llmJudge', () => {
  it('passes when the model returns a score >= passThreshold', async () => {
    const scorer = llmJudge({ provider: buildProvider('8'), passThreshold: 7 });
    const r = await scorer.score({
      case: { input: 'q' } as never,
      output: 'a' as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
    expect(r.score).toBeCloseTo(0.8);
  });

  it('fails when the model returns a score below the threshold', async () => {
    const scorer = llmJudge({ provider: buildProvider('5'), passThreshold: 7 });
    const r = await scorer.score({
      case: { input: 'q' } as never,
      output: 'a' as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
    expect(r.score).toBeCloseTo(0.5);
  });

  it('fails when the model emits an unparseable reply', async () => {
    const scorer = llmJudge({ provider: buildProvider("I can't grade this") });
    const r = await scorer.score({
      case: { input: 'q' } as never,
      output: 'a' as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(false);
    expect(r.reason).toMatch(/unparseable/);
  });

  it('clamps out-of-range model replies', async () => {
    const scorer = llmJudge({ provider: buildProvider('99'), maxScore: 10 });
    const r = await scorer.score({
      case: { input: 'q' } as never,
      output: 'a' as never,
      durationMs: 0,
    });
    expect(r.score).toBe(1);
    expect((r.metadata as { clamped: number }).clamped).toBe(10);
  });

  it('embeds the case.expected reference in the default prompt when provided', async () => {
    let captured = '';
    const scorer = llmJudge({
      provider: buildProvider((req) => {
        const m = req.messages[0]?.content[0];
        if (typeof m === 'object' && m !== null && 'text' in m) {
          captured = (m as { text: string }).text;
        }
        return '9';
      }),
    });
    await scorer.score({
      case: { input: 'q', expected: 'gold-answer' } as never,
      output: 'candidate' as never,
      durationMs: 0,
    });
    expect(captured).toContain('gold-answer');
    expect(captured).toContain('candidate');
  });
});

describe('prebuilt scorers', () => {
  it('toxicityScorer wraps the judge with the safety rubric', async () => {
    const scorer = toxicityScorer({ provider: buildProvider('10') });
    const r = await scorer.score({
      case: { input: 'q' } as never,
      output: 'a totally fine reply' as never,
      durationMs: 0,
    });
    expect(scorer.name).toBe('toxicity');
    expect(r.pass).toBe(true);
  });

  it('factualityScorer wraps the judge with the factuality rubric', async () => {
    const scorer = factualityScorer({ provider: buildProvider('8'), passThreshold: 7 });
    expect(scorer.name).toBe('factuality');
    const r = await scorer.score({
      case: { input: 'who wrote graphorin?' } as never,
      output: 'Oleksiy Stepurenko' as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });

  it('helpfulnessScorer wraps the judge with the helpfulness rubric', async () => {
    const scorer = helpfulnessScorer({ provider: buildProvider('9') });
    expect(scorer.name).toBe('helpfulness');
    const r = await scorer.score({
      case: { input: 'how do I rerank?' } as never,
      output: 'use createCrossEncoderReranker(...)' as never,
      durationMs: 0,
    });
    expect(r.pass).toBe(true);
  });
});
