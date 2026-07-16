/**
 * Coverage for `withCostTracking` - onUsage hook fires on stream
 * `finish` events and on `generate()`; `priceLookup` populates
 * `costUsd`; absent hook is a no-op.
 */
import type { ProviderRequest } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  createCostAccumulator,
  withCostTracking,
} from '../../src/middleware/with-cost-tracking.js';
import { bareAdapter } from '../fixtures/bare-adapter.js';

const REQ: ProviderRequest = { messages: [{ role: 'user', content: 'hi' }] };

interface UsageRecord {
  providerName: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
}

describe('withCostTracking', () => {
  it('fires onUsage on the stream finish event', async () => {
    const records: UsageRecord[] = [];
    const wrapped = withCostTracking({
      onUsage: ({
        providerName,
        modelId,
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd,
      }) => {
        records.push({
          providerName,
          modelId,
          promptTokens,
          completionTokens,
          totalTokens,
          costUsd,
        });
      },
    })(bareAdapter());
    for await (const _ of wrapped.stream(REQ)) void _;
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      providerName: 'bare',
      modelId: 'bare-model',
      promptTokens: 5,
      completionTokens: 3,
      totalTokens: 8,
      costUsd: 0,
    });
  });

  it('fires onUsage on generate()', async () => {
    const records: UsageRecord[] = [];
    const wrapped = withCostTracking({
      onUsage: ({
        providerName,
        modelId,
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd,
      }) => {
        records.push({
          providerName,
          modelId,
          promptTokens,
          completionTokens,
          totalTokens,
          costUsd,
        });
      },
    })(bareAdapter());
    await wrapped.generate(REQ);
    expect(records).toHaveLength(1);
    expect(records[0]?.totalTokens).toBe(8);
  });

  it('createCostAccumulator accumulates real totals per provider×model (PS-8)', async () => {
    const acc = createCostAccumulator();
    const wrapped = withCostTracking({
      onUsage: acc.onUsage,
      priceLookup: () => ({ inputPerMtok: 1, outputPerMtok: 2 }),
    })(bareAdapter());
    await wrapped.generate(REQ);
    await wrapped.generate(REQ);

    const t = acc.totalFor('bare', 'bare-model');
    expect(t.callCount).toBe(2);
    expect(t.promptTokens).toBe(10); // 5 × 2 calls
    expect(t.completionTokens).toBe(6);
    expect(t.totalTokens).toBe(16);
    // Per call: 5·1/1e6 (input) + 3·2/1e6 (output); two calls.
    expect(t.costUsd).toBeCloseTo(2 * (5 / 1e6 + (3 * 2) / 1e6), 10);
    expect(acc.totals().size).toBe(1);

    acc.reset();
    expect(acc.totalFor('bare', 'bare-model').callCount).toBe(0);
    expect(acc.totals().size).toBe(0);
  });

  it('uses priceLookup to populate costUsd', async () => {
    const records: UsageRecord[] = [];
    const wrapped = withCostTracking({
      onUsage: ({
        providerName,
        modelId,
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd,
      }) => {
        records.push({
          providerName,
          modelId,
          promptTokens,
          completionTokens,
          totalTokens,
          costUsd,
        });
      },
      priceLookup: () => ({ inputPerMtok: 1_000_000, outputPerMtok: 2_000_000 }),
    })(bareAdapter());
    await wrapped.generate(REQ);
    // 5 input * 1.00 USD + 3 output * 2.00 USD = 11.00 USD
    expect(records[0]?.costUsd).toBeCloseTo(11);
  });

  it('handles a partially-defined priceLookup (only inputPerMtok)', async () => {
    const records: UsageRecord[] = [];
    const wrapped = withCostTracking({
      onUsage: ({
        costUsd,
        providerName,
        modelId,
        promptTokens,
        completionTokens,
        totalTokens,
      }) => {
        records.push({
          providerName,
          modelId,
          promptTokens,
          completionTokens,
          totalTokens,
          costUsd,
        });
      },
      priceLookup: () => ({ inputPerMtok: 500_000 }),
    })(bareAdapter());
    await wrapped.generate(REQ);
    expect(records[0]?.costUsd).toBeCloseTo(2.5);
  });

  it('treats a null priceLookup return as "no pricing available"', async () => {
    const records: UsageRecord[] = [];
    const wrapped = withCostTracking({
      onUsage: ({
        costUsd,
        providerName,
        modelId,
        promptTokens,
        completionTokens,
        totalTokens,
      }) => {
        records.push({
          providerName,
          modelId,
          promptTokens,
          completionTokens,
          totalTokens,
          costUsd,
        });
      },
      priceLookup: () => null,
    })(bareAdapter());
    await wrapped.generate(REQ);
    expect(records[0]?.costUsd).toBe(0);
  });

  it('is a complete no-op when onUsage is absent', async () => {
    const wrapped = withCostTracking({})(bareAdapter());
    const result = await wrapped.generate(REQ);
    expect(result.finishReason).toBe('stop');
    for await (const _ of wrapped.stream(REQ)) void _;
  });

  it('passes the per-request metadata through to onUsage', async () => {
    let capturedMetadata: unknown;
    const wrapped = withCostTracking({
      onUsage: ({ metadata }) => {
        capturedMetadata = metadata;
      },
    })(bareAdapter());
    await wrapped.generate({ ...REQ, metadata: { sessionId: 's1' } });
    expect(capturedMetadata).toMatchObject({ sessionId: 's1' });
  });

  // R-01: withCostTracking must STAMP the computed cost onto usage.cost so
  // the agent run loop folds it into state.usage.cost and RunBudget.maxCostUsd
  // can enforce. The onUsage hook alone never reached the run-level aggregate.
  it('stamps usage.cost on the generate() result when priceLookup is present', async () => {
    const wrapped = withCostTracking({
      priceLookup: () => ({ inputPerMtok: 1_000_000, outputPerMtok: 2_000_000 }),
    })(bareAdapter());
    const result = await wrapped.generate(REQ);
    // 5 input @ $1 + 3 output @ $2 = 11 USD
    expect(result.usage.cost).toEqual({ amount: 11, currency: 'USD' });
  });

  it('stamps usage.cost on the stream finish event when priceLookup is present', async () => {
    const wrapped = withCostTracking({
      priceLookup: () => ({ inputPerMtok: 1_000_000, outputPerMtok: 2_000_000 }),
    })(bareAdapter());
    let finishCost: unknown;
    for await (const event of wrapped.stream(REQ)) {
      if (event.type === 'finish') finishCost = event.usage.cost;
    }
    expect(finishCost).toEqual({ amount: 11, currency: 'USD' });
  });

  it('stamps usage.cost even when onUsage is absent (budget-only wiring)', async () => {
    const wrapped = withCostTracking({
      priceLookup: () => ({ inputPerMtok: 1_000_000, outputPerMtok: 2_000_000 }),
    })(bareAdapter());
    const result = await wrapped.generate(REQ);
    expect(result.usage.cost).toEqual({ amount: 11, currency: 'USD' });
  });

  it('does NOT stamp usage.cost when priceLookup is absent (leaves provider cost untouched)', async () => {
    const base = bareAdapter();
    const providerReportsCost = {
      ...base,
      generate: async () => ({
        text: 'ok',
        usage: {
          promptTokens: 5,
          completionTokens: 3,
          totalTokens: 8,
          cost: { amount: 0.42, currency: 'USD' as const },
        },
        finishReason: 'stop' as const,
      }),
    };
    const wrapped = withCostTracking({})(providerReportsCost);
    const result = await wrapped.generate(REQ);
    // Provider-reported cost survives; the middleware did not overwrite it.
    expect(result.usage.cost).toEqual({ amount: 0.42, currency: 'USD' });
  });

  it('bills separately-reported reasoningTokens at the output rate (PS-19)', async () => {
    const base = bareAdapter();
    const reasoningProvider = {
      ...base,
      generate: async () => ({
        text: 'ok',
        usage: { promptTokens: 5, completionTokens: 3, reasoningTokens: 7, totalTokens: 15 },
        finishReason: 'stop' as const,
      }),
    };
    const records: number[] = [];
    const wrapped = withCostTracking({
      onUsage: ({ costUsd }) => {
        records.push(costUsd);
      },
      priceLookup: () => ({ inputPerMtok: 1_000_000, outputPerMtok: 2_000_000 }),
    })(reasoningProvider);
    await wrapped.generate(REQ);
    // 5 input * 1.00 + (3 completion + 7 reasoning) * 2.00 = 25.00 USD
    expect(records[0]).toBeCloseTo(25);
  });
});

describe('prompt-cache cost legs (core-provider-02)', () => {
  const cacheUsageProvider = (usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedReadTokens?: number;
    cacheWriteTokens?: number;
  }) => {
    const base = bareAdapter();
    return {
      ...base,
      async generate() {
        return { text: 'hi', usage, finishReason: 'stop' as const };
      },
    };
  };

  it('bills cache reads/writes at their own rates and the remainder at the input rate', async () => {
    const seen: Array<{
      costUsd: number;
      cachedReadTokens?: number;
      cacheWriteTokens?: number;
    }> = [];
    const wrapped = withCostTracking({
      onUsage: (info) => {
        seen.push({
          costUsd: info.costUsd,
          ...(info.cachedReadTokens !== undefined
            ? { cachedReadTokens: info.cachedReadTokens }
            : {}),
          ...(info.cacheWriteTokens !== undefined
            ? { cacheWriteTokens: info.cacheWriteTokens }
            : {}),
        });
      },
      priceLookup: () => ({
        inputPerMtok: 3,
        outputPerMtok: 15,
        cachedReadPerMtok: 0.3,
        cacheWritePerMtok: 3.75,
      }),
    })(
      cacheUsageProvider({
        promptTokens: 1_000_000, // includes both cache legs
        completionTokens: 0,
        totalTokens: 1_000_000,
        cachedReadTokens: 800_000,
        cacheWriteTokens: 100_000,
      }),
    );
    await wrapped.generate(REQ);
    expect(seen).toHaveLength(1);
    // 100k base @ $3 + 800k reads @ $0.30 + 100k writes @ $3.75 (per Mtok)
    expect(seen[0]?.costUsd).toBeCloseTo(0.1 * 3 + 0.8 * 0.3 + 0.1 * 3.75, 10);
    expect(seen[0]?.cachedReadTokens).toBe(800_000);
    expect(seen[0]?.cacheWriteTokens).toBe(100_000);
  });

  it('falls back to the full input rate for cache legs when cache rates are absent', async () => {
    const seen: number[] = [];
    const wrapped = withCostTracking({
      onUsage: (info) => {
        seen.push(info.costUsd);
      },
      priceLookup: () => ({ inputPerMtok: 2, outputPerMtok: 10 }),
    })(
      cacheUsageProvider({
        promptTokens: 1_000_000,
        completionTokens: 0,
        totalTokens: 1_000_000,
        cachedReadTokens: 500_000,
      }),
    );
    await wrapped.generate(REQ);
    // No cache rates -> identical to billing the whole prompt at input rate.
    expect(seen[0]).toBeCloseTo(2, 10);
  });
});
