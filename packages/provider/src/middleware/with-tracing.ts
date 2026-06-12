/**
 * `withTracing` — outermost middleware. Wraps every `provider.stream`
 * / `provider.generate` call in a Graphorin OTel-shaped span so the
 * span captures retry decisions, rate-limit waits, and the underlying
 * provider call as one logical unit.
 *
 * The middleware accepts any object that exposes the
 * {@link Tracer} contract from `@graphorin/core/contracts`. Tests pass
 * a `NOOP_TRACER`-shaped stub; production wires the real Graphorin
 * tracer from `@graphorin/observability`.
 *
 * @packageDocumentation
 */

import type { Provider, Tracer } from '@graphorin/core';

import { defineProviderMiddleware } from './compose.js';

/**
 * Options for {@link withTracing}.
 *
 * @stable
 */
export interface WithTracingOptions {
  /** Tracer instance. Defaults to a no-op tracer if unset. */
  readonly tracer?: Tracer;
}

/**
 * @stable
 */
export const withTracing = defineProviderMiddleware<WithTracingOptions>({
  kind: 'withTracing',
  factory: (opts: WithTracingOptions) => {
    return (next: Provider): Provider => ({
      name: next.name,
      modelId: next.modelId,
      capabilities: next.capabilities,
      ...(next.acceptsSensitivity !== undefined
        ? { acceptsSensitivity: next.acceptsSensitivity }
        : {}),
      stream(req) {
        if (opts.tracer === undefined) return next.stream(req);
        return tracedStream(opts.tracer, next, req);
      },
      async generate(req) {
        if (opts.tracer === undefined) return next.generate(req);
        return opts.tracer.span(
          {
            type: 'provider.generate' as const,
            attrs: {
              'graphorin.provider.id': next.name,
              'graphorin.provider.model': next.modelId,
            },
          },
          async () => next.generate(req),
        );
      },
      ...(next.countTokens ? { countTokens: next.countTokens.bind(next) } : {}),
    });
  },
});

async function* tracedStream(
  tracer: Tracer,
  next: Provider,
  req: import('@graphorin/core').ProviderRequest,
): AsyncIterable<import('@graphorin/core').ProviderEvent> {
  const span = tracer.startSpan({
    type: 'provider.stream' as const,
    attrs: {
      'graphorin.provider.id': next.name,
      'graphorin.provider.model': next.modelId,
    },
  });
  try {
    for await (const event of next.stream(req)) {
      yield event;
    }
    span.setStatus('ok');
  } catch (err) {
    span.recordException(err);
    span.setStatus('error', (err as Error).message);
    throw err;
  } finally {
    // PS-7: a consumer `break`/early-return injects a generator `return` at the
    // `yield`, skipping both the success and catch paths. Ending the span in
    // `finally` guarantees it is closed exactly once on every exit — normal
    // completion, error, or early abort (which leaves the status unset).
    span.end();
  }
}
