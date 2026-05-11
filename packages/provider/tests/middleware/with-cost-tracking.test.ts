/**
 * Coverage for `withCostTracking` — onUsage hook fires on stream
 * `finish` events and on `generate()`; `priceLookup` populates
 * `costUsd`; absent hook is a no-op.
 */
import type { ProviderRequest } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { withCostTracking } from '../../src/middleware/with-cost-tracking.js';
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
});
