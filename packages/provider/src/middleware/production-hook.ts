/**
 * Production startup hook — fails fast when a security-critical
 * middleware is missing from the composed chain. The default
 * configuration enforces `withRedaction`; consumers can extend the
 * `requiredKinds` list to lock additional middlewares.
 *
 * @packageDocumentation
 */

import type { Provider } from '@graphorin/core';

import { MissingProductionMiddlewareError } from '../errors/errors.js';
import { providerHasMiddleware } from './compose.js';

/**
 * Options for {@link assertProductionMiddleware}.
 *
 * @stable
 */
export interface ProductionStartupHookOptions {
  /** Middleware kinds that must be present. Defaults to `['withRedaction']`. */
  readonly requiredKinds?: ReadonlyArray<string>;
  /** Force the check regardless of `NODE_ENV`. */
  readonly force?: boolean;
}

/**
 * Throw {@link MissingProductionMiddlewareError} if a required
 * middleware is missing from the chain rooted at `provider`. The
 * check runs only when `NODE_ENV === 'production'` unless `force` is
 * `true`.
 *
 * @stable
 */
export function assertProductionMiddleware(
  provider: Provider,
  options: ProductionStartupHookOptions = {},
): void {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd && options.force !== true) return;
  const required = options.requiredKinds ?? ['withRedaction'];
  for (const kind of required) {
    if (!providerHasMiddleware(provider, kind)) {
      throw new MissingProductionMiddlewareError(kind);
    }
  }
}
