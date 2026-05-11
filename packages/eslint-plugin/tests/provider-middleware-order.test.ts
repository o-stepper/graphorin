import { describe, expect, it } from 'vitest';

import { lintSource } from './_lint.js';

describe('@graphorin/provider-middleware-order', () => {
  it('passes when middlewares are in canonical order (factory calls)', () => {
    const messages = lintSource({
      source: `
        const provider = composeProviderMiddleware([
          withTracing(),
          withRetry(),
          withRateLimit(),
          withCostLimit(),
          withCostTracking(),
          withFallback(),
          withRedaction(),
        ], adapter);
      `,
      rule: 'provider-middleware-order',
    });
    expect(messages).toEqual([]);
  });

  it('flags an out-of-order middleware (withRetry after withFallback)', () => {
    const messages = lintSource({
      source: `
        const provider = composeProviderMiddleware([
          withTracing(),
          withFallback(),
          withRetry(),
        ], adapter);
      `,
      rule: 'provider-middleware-order',
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('orderingViolation');
    expect(messages[0]?.message).toMatch(/withRetry/);
    expect(messages[0]?.message).toMatch(/withFallback/);
  });

  it('flags ordering errors with bare identifier references too', () => {
    const messages = lintSource({
      source: `
        const provider = composeProviderMiddleware([
          withFallback,
          withTracing,
        ], adapter);
      `,
      rule: 'provider-middleware-order',
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('orderingViolation');
  });

  it('tolerates unknown middleware names at any position', () => {
    const messages = lintSource({
      source: `
        const provider = composeProviderMiddleware([
          withTracing(),
          withCustomLogger(),
          withRetry(),
          withFallback(),
        ], adapter);
      `,
      rule: 'provider-middleware-order',
    });
    expect(messages).toEqual([]);
  });

  it('also recognises namespaced calls (provider.composeProviderMiddleware)', () => {
    const messages = lintSource({
      source: `
        const p = provider.composeProviderMiddleware([
          withFallback(),
          withRetry(),
        ], adapter);
      `,
      rule: 'provider-middleware-order',
    });
    expect(messages).toHaveLength(1);
  });
});
