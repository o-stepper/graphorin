/**
 * `withFallback` - request-level fallback chain. When the wrapped
 * provider raises a fallback-eligible error, the middleware retries
 * the same request against each alternate provider in `fallbacks`.
 * The model concept is preserved: callers wire `[primary, alt1, alt2]`
 * pointing at providers serving the same logical model. Cross-model
 * fallbacks are the agent-level concern (Phase 12).
 *
 * @packageDocumentation
 */

import type { Provider, ProviderEvent, ProviderResponse } from '@graphorin/core';

import { isRetryableProviderFailure } from '../errors/retryability.js';
import { defineProviderMiddleware } from './compose.js';

/**
 * Options for {@link withFallback}.
 *
 * @stable
 */
export interface WithFallbackOptions {
  /** Alternate providers tried in order. */
  readonly fallbacks: ReadonlyArray<Provider>;
  /** Predicate deciding whether an error should trigger a fallback. */
  readonly shouldFallback?: (err: unknown) => boolean;
  /** Optional log sink; defaults to `console.warn`. */
  readonly logger?: (message: string, meta?: object) => void;
}

/**
 * @stable
 */
export const withFallback = defineProviderMiddleware<WithFallbackOptions>({
  kind: 'withFallback',
  factory: (opts: WithFallbackOptions) => {
    const shouldFallback = opts.shouldFallback ?? defaultShouldFallback;
    const logger = opts.logger ?? defaultLogger;
    if (!Array.isArray(opts.fallbacks) || opts.fallbacks.length === 0) {
      throw new TypeError('withFallback: fallbacks array must contain at least one Provider.');
    }
    return (next: Provider): Provider => {
      const candidates: ReadonlyArray<Provider> = [next, ...opts.fallbacks];
      return {
        name: next.name,
        modelId: next.modelId,
        capabilities: next.capabilities,
        ...(next.acceptsSensitivity !== undefined
          ? { acceptsSensitivity: next.acceptsSensitivity }
          : {}),
        stream(req) {
          return fallbackStream(candidates, req, shouldFallback, logger);
        },
        async generate(req) {
          let lastErr: unknown;
          for (let i = 0; i < candidates.length; i++) {
            const cand = candidates[i];
            if (cand === undefined) continue;
            try {
              return await cand.generate(req);
            } catch (err) {
              if (req.signal?.aborted) throw err;
              lastErr = err;
              if (i === candidates.length - 1 || !shouldFallback(err)) throw err;
              logger(`[graphorin/provider] withFallback: '${cand.name}' failed, trying next.`, {
                error: (err as Error).message,
              });
            }
          }
          throw lastErr ?? new Error('withFallback: no fallback succeeded.');
        },
        ...(next.countTokens ? { countTokens: next.countTokens.bind(next) } : {}),
      };
    };
  },
});

async function* fallbackStream(
  candidates: ReadonlyArray<Provider>,
  req: import('@graphorin/core').ProviderRequest,
  shouldFallback: (err: unknown) => boolean,
  logger: (message: string, meta?: object) => void,
): AsyncIterable<ProviderEvent> {
  let lastErr: unknown;
  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    if (cand === undefined) continue;
    let yieldedAny = false;
    try {
      for await (const event of cand.stream(req)) {
        yieldedAny = true;
        yield event;
      }
      return;
    } catch (err) {
      if (req.signal?.aborted) throw err;
      lastErr = err;
      if (yieldedAny) {
        // Once we have streamed events, falling back would split the
        // logical response across providers - propagate instead.
        throw err;
      }
      if (i === candidates.length - 1 || !shouldFallback(err)) throw err;
      logger(`[graphorin/provider] withFallback: '${cand.name}' failed, trying next.`, {
        error: (err as Error).message,
      });
    }
  }
  throw lastErr ?? new Error('withFallback: no fallback succeeded.');
}

function defaultShouldFallback(err: unknown): boolean {
  // Fallback eligibility and retry eligibility are the same
  // classification: a 429 on the primary is exactly the case a
  // same-model fallback chain exists for (the alternate deployment has
  // its own rate budget), a `status: 0` network failure is the headline
  // scenario (the primary local server is down), and a 400/context
  // overflow must never advance the chain. One shared predicate keeps
  // `withRetry` and `withFallback` from drifting.
  return isRetryableProviderFailure(err);
}

function defaultLogger(message: string, meta?: object): void {
  if (meta !== undefined) console.warn(message, meta);
  else console.warn(message);
}

// Cast to silence the "declared but unused" lint when only the types
// are needed by consumers.
export type _FallbackResponseGuard = ProviderResponse;
