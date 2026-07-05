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

import { isAbortError } from '../internal/abort.js';
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
  if (err === null || typeof err !== 'object') return false;
  // An aborted request must not trigger a fallback, even as a `status: 0`
  // network error (PS-2). The loop also short-circuits on `req.signal?.aborted`.
  if (isAbortError(err)) return false;
  const e = err as { kind?: string; errorKind?: string; status?: number };
  // `ProviderHttpError.kind` is always 'provider-http' (stable discriminant);
  // the mapped canonical kind rides on `errorKind`. Consult both so a 429
  // fails over as a rate limit and a 400/context overflow never does.
  const kinds = [e.kind, e.errorKind];
  if (
    kinds.includes('unauthorized') ||
    kinds.includes('invalid-request') ||
    kinds.includes('context-length') ||
    kinds.includes('content-filter')
  ) {
    return false;
  }
  if (
    kinds.includes('transient') ||
    kinds.includes('rate-limit') ||
    kinds.includes('rate-limit-exceeded') ||
    kinds.includes('capacity')
  ) {
    return true;
  }
  // A 429 on the primary is exactly the case a same-model fallback chain
  // exists for - the alternate deployment has its own rate budget.
  if (typeof e.status === 'number' && e.status === 429) return true;
  if (typeof e.status === 'number' && e.status >= 500) return true;
  // PS-2: the headline fallback scenario - the primary provider is down
  // (a local server refusing connections) surfaces as `status: 0`. Treat a
  // network failure as fallback-eligible so the chain advances to the next
  // provider (abort already excluded above).
  if (typeof e.status === 'number' && e.status === 0) return true;
  return false;
}

function defaultLogger(message: string, meta?: object): void {
  if (meta !== undefined) console.warn(message, meta);
  else console.warn(message);
}

// Cast to silence the "declared but unused" lint when only the types
// are needed by consumers.
export type _FallbackResponseGuard = ProviderResponse;
