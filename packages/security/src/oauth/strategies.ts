/**
 * Per-provider strategy registry. Lets the framework / consumers
 * register hooks for known OAuth quirks (e.g. providers that rotate
 * `client_secret` on every refresh, or that expire refresh tokens
 * after a single use) without forking the core flow.
 *
 * @packageDocumentation
 */

import type { OAuthStrategy } from './types.js';

const strategies: OAuthStrategy[] = [];

/**
 * Register a strategy. Returns an unsubscribe function so tests can
 * tear the registration down.
 *
 * @stable
 */
export function registerOAuthStrategy(strategy: OAuthStrategy): () => void {
  strategies.push(strategy);
  return () => {
    const index = strategies.indexOf(strategy);
    if (index !== -1) strategies.splice(index, 1);
  };
}

/**
 * Find every strategy that matches the given server descriptor. The
 * matching is `OR` — either the URL or the ID regex matching is
 * enough to enrol the strategy.
 *
 * @stable
 */
export function findOAuthStrategies(args: {
  readonly serverId: string;
  readonly serverUrl: string;
}): ReadonlyArray<OAuthStrategy> {
  const matches: OAuthStrategy[] = [];
  for (const strategy of strategies) {
    if (strategy.matchUrl?.test(args.serverUrl) === true) {
      matches.push(strategy);
      continue;
    }
    if (strategy.matchId?.test(args.serverId) === true) {
      matches.push(strategy);
    }
  }
  return Object.freeze(matches);
}

/**
 * Snapshot of the registered strategies. Used by `getOAuthStatus()`.
 *
 * @stable
 */
export function listOAuthStrategies(): ReadonlyArray<OAuthStrategy> {
  return Object.freeze([...strategies]);
}

/**
 * Reset the registry. Used by tests.
 *
 * @experimental
 */
export function _resetOAuthStrategiesForTesting(): void {
  strategies.length = 0;
}
