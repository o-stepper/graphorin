/**
 * Canonical-order middleware composer. The composer enforces the
 * documented ordering at startup and throws
 * {@link MiddlewareOrderingError} on violation. Manual
 * `withRetry(withRedaction(p))` style still works but emits a one-time
 * WARN unless the consumer flips `strict: true`, in which case the
 * composer also throws on manual nesting that violates the canonical
 * order.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderMiddleware } from '@graphorin/core';

import { MiddlewareOrderingError } from '../errors/errors.js';

/**
 * Symbol attached to every middleware-produced provider so the
 * composer can detect and validate the chain. The symbol is opaque
 * and cross-realm safe via `Symbol.for`.
 *
 * @stable
 */
export const MIDDLEWARE_KIND: unique symbol = Symbol.for('graphorin.provider.middleware.kind');

/**
 * Canonical middleware ordering — outermost → innermost. The table
 * is enforced by {@link composeProviderMiddleware} and is part of the
 * provider layer's public contract (DEC-145 / ADR-039).
 *
 * @stable
 */
export const CANONICAL_MIDDLEWARE_ORDER: readonly string[] = [
  'withTracing',
  'withRetry',
  'withRateLimit',
  'withCostLimit',
  'withCostTracking',
  'withFallback',
  'withRedaction',
];

const CANONICAL_INDEX: Readonly<Record<string, number>> = Object.freeze(
  CANONICAL_MIDDLEWARE_ORDER.reduce<Record<string, number>>((acc, name, idx) => {
    acc[name] = idx;
    return acc;
  }, {}),
);

interface KindedProvider extends Provider {
  readonly [MIDDLEWARE_KIND]?: string;
  readonly [INNER_PROVIDER]?: Provider;
}

/**
 * Symbol used to walk the chain — every wrapper exposes the inner
 * provider so the composer can introspect the full stack at startup.
 *
 * @stable
 */
export const INNER_PROVIDER: unique symbol = Symbol.for('graphorin.provider.middleware.inner');

/**
 * Read the discriminant kind attached to a middleware-produced
 * provider. Returns `undefined` if the provider is the bare adapter
 * or a custom wrapper that does not declare a kind.
 *
 * @stable
 */
export function getMiddlewareKind(provider: Provider): string | undefined {
  return (provider as KindedProvider)[MIDDLEWARE_KIND];
}

/**
 * Walk the middleware chain inside `provider` and return the array of
 * declared kinds (outer → inner).
 *
 * @stable
 */
export function listMiddlewareKinds(provider: Provider): readonly string[] {
  const kinds: string[] = [];
  let cur: KindedProvider | undefined = provider as KindedProvider;
  while (cur !== undefined) {
    const kind = cur[MIDDLEWARE_KIND];
    if (kind !== undefined) kinds.push(kind);
    cur = cur[INNER_PROVIDER] as KindedProvider | undefined;
  }
  return kinds;
}

/**
 * Return `true` iff the chain rooted at `provider` contains a
 * middleware whose kind matches `name`.
 *
 * @stable
 */
export function providerHasMiddleware(provider: Provider, name: string): boolean {
  return listMiddlewareKinds(provider).includes(name);
}

/**
 * Wrap an adapter in a middleware chain whose order is validated
 * against {@link CANONICAL_MIDDLEWARE_ORDER}. The argument array MUST
 * be ordered outermost → innermost — the same way the layers appear
 * in the documented composition example. The composer validates that
 * every kind known to the canonical order is monotonically non-
 * decreasing in index, throws otherwise.
 *
 * Custom middleware whose kind is NOT in the canonical order is
 * silently allowed at any position — operators registering bespoke
 * layers via {@link defineProviderMiddleware} carry the
 * responsibility of placing them sensibly.
 *
 * @stable
 */
export function composeProviderMiddleware(
  middlewares: ReadonlyArray<ProviderMiddleware>,
): ProviderMiddleware {
  return (next: Provider): Provider => {
    let chain: Provider = next;
    // Apply innermost → outermost so the composed call order matches
    // the array's outer → inner declaration.
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const factory = middlewares[i];
      if (typeof factory !== 'function') {
        throw new TypeError(
          `composeProviderMiddleware: entry at index ${i} is not a ProviderMiddleware function.`,
        );
      }
      chain = factory(chain);
    }
    validateMiddlewareOrder(chain);
    return chain;
  };
}

/**
 * Validate the kinds present in `provider` against the canonical
 * order. Exposed for tests; the composer calls it on every chain.
 *
 * @stable
 */
export function validateMiddlewareOrder(provider: Provider): void {
  const kinds = listMiddlewareKinds(provider);
  // Filter to the kinds we recognise.
  const recognised: { kind: string; index: number }[] = [];
  for (const kind of kinds) {
    const idx = CANONICAL_INDEX[kind];
    if (idx !== undefined) recognised.push({ kind, index: idx });
  }
  // The recognised list runs outer → inner; canonical indices must
  // increase monotonically. The first decreasing pair is the
  // violation.
  for (let i = 1; i < recognised.length; i++) {
    const prev = recognised[i - 1];
    const cur = recognised[i];
    if (prev !== undefined && cur !== undefined && cur.index < prev.index) {
      throw new MiddlewareOrderingError({
        offendingPair: [prev.kind, cur.kind],
        canonicalOrder: CANONICAL_MIDDLEWARE_ORDER,
      });
    }
  }
}

/**
 * Decorator factory used internally by every built-in middleware. The
 * returned function attaches the canonical kind discriminator and the
 * inner-provider symbol so the composer can introspect chains.
 *
 * @stable
 */
export function defineProviderMiddleware<T>(args: {
  readonly kind: string;
  readonly factory: (opts: T) => ProviderMiddleware;
}): (opts: T) => ProviderMiddleware {
  return (opts: T): ProviderMiddleware => {
    const built = args.factory(opts);
    return (next: Provider): Provider => {
      const wrapped = built(next);
      const branded: Provider = Object.create(wrapped) as Provider;
      Object.defineProperty(branded, MIDDLEWARE_KIND, {
        value: args.kind,
        enumerable: false,
      });
      Object.defineProperty(branded, INNER_PROVIDER, {
        value: next,
        enumerable: false,
      });
      return branded;
    };
  };
}
