import { describe, expect, it } from 'vitest';

import { MissingProductionMiddlewareError } from '../../src/errors/errors.js';
import {
  composeProviderMiddleware,
  defineProviderMiddleware,
} from '../../src/middleware/compose.js';
import { assertProductionMiddleware } from '../../src/middleware/production-hook.js';
import { withRedaction } from '../../src/middleware/with-redaction.js';
import { withTracing } from '../../src/middleware/with-tracing.js';
import { bareAdapter } from '../fixtures/bare-adapter.js';

describe('assertProductionMiddleware', () => {
  it('passes when withRedaction is wired', () => {
    const composed = composeProviderMiddleware([withTracing({}), withRedaction({})])(bareAdapter());
    expect(() => assertProductionMiddleware(composed, { force: true })).not.toThrow();
  });

  it('throws MissingProductionMiddlewareError when withRedaction is missing', () => {
    const composed = composeProviderMiddleware([withTracing({})])(bareAdapter());
    expect(() => assertProductionMiddleware(composed, { force: true })).toThrow(
      MissingProductionMiddlewareError,
    );
  });

  it('is a no-op outside production unless force is true', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const composed = composeProviderMiddleware([withTracing({})])(bareAdapter());
      expect(() => assertProductionMiddleware(composed)).not.toThrow();
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it('honours custom requiredKinds list', () => {
    const withMyCustom = defineProviderMiddleware<Record<string, never>>({
      kind: 'withMyCustom',
      factory: () => (next) => ({
        ...next,
        stream: next.stream.bind(next),
        generate: next.generate.bind(next),
      }),
    });
    const composed = composeProviderMiddleware([withMyCustom({}), withRedaction({})])(
      bareAdapter(),
    );
    expect(() =>
      assertProductionMiddleware(composed, { force: true, requiredKinds: ['withMyCustom'] }),
    ).not.toThrow();
    const composedWithout = composeProviderMiddleware([withRedaction({})])(bareAdapter());
    expect(() =>
      assertProductionMiddleware(composedWithout, {
        force: true,
        requiredKinds: ['withMyCustom'],
      }),
    ).toThrow(MissingProductionMiddlewareError);
  });
});
