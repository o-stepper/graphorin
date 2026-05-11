/**
 * `withCostLimit` — enforce per-session / per-run / per-agent /
 * per-hour cost ceilings. Couples with {@link withCostTracking} for
 * the underlying accumulator. The middleware is positioned between
 * `withRateLimit` and `withCostTracking` per the canonical order so a
 * budget breach trips before the request hits the underlying
 * provider.
 *
 * @packageDocumentation
 */

import type { Provider } from '@graphorin/core';

import { CostBudgetExceededError } from '../errors/errors.js';
import { defineProviderMiddleware } from './compose.js';

/**
 * Options for {@link withCostLimit}.
 *
 * @stable
 */
export interface WithCostLimitOptions {
  /** Maximum cumulative USD cost per session. */
  readonly maxPerSession?: number;
  /** Maximum cumulative USD cost per run. */
  readonly maxPerRun?: number;
  /** Maximum cumulative USD cost per hour. */
  readonly maxPerHour?: number;
  /** What to do on breach. Default `'throw'`. */
  readonly onExceed?: 'throw' | 'warn';
  /**
   * Resolver returning the current observed cost for the relevant
   * scope. The resolver lets consumers wire any accumulator (the
   * shipped `@graphorin/observability/cost.CostTracker` works out of
   * the box). When unset, the middleware is a no-op (a placeholder
   * for tooling that wires the accumulator later).
   */
  readonly resolveObservedCost?: (
    scope: 'session' | 'run' | 'hour',
    metadata: Readonly<Record<string, unknown>> | undefined,
  ) => number;
  /** Optional sink for `'warn'` mode. Defaults to `console.warn`. */
  readonly logger?: (message: string, meta?: object) => void;
}

/**
 * @stable
 */
export const withCostLimit = defineProviderMiddleware<WithCostLimitOptions>({
  kind: 'withCostLimit',
  factory: (opts: WithCostLimitOptions) => {
    const onExceed = opts.onExceed ?? 'throw';
    const resolver = opts.resolveObservedCost;
    const logger = opts.logger ?? defaultLogger;
    return (next: Provider): Provider => ({
      name: next.name,
      modelId: next.modelId,
      capabilities: next.capabilities,
      ...(next.acceptsSensitivity !== undefined
        ? { acceptsSensitivity: next.acceptsSensitivity }
        : {}),
      stream(req) {
        if (resolver !== undefined) {
          check(asRecord(req.metadata), resolver, opts, onExceed, logger);
        }
        return next.stream(req);
      },
      async generate(req) {
        if (resolver !== undefined) {
          check(asRecord(req.metadata), resolver, opts, onExceed, logger);
        }
        return next.generate(req);
      },
      ...(next.countTokens ? { countTokens: next.countTokens.bind(next) } : {}),
    });
  },
});

function check(
  metadata: Readonly<Record<string, unknown>> | undefined,
  resolver: (
    scope: 'session' | 'run' | 'hour',
    metadata?: Readonly<Record<string, unknown>>,
  ) => number,
  opts: WithCostLimitOptions,
  onExceed: 'throw' | 'warn',
  logger: (message: string, meta?: object) => void,
): void {
  const checks: Array<['session' | 'run' | 'hour', number | undefined]> = [
    ['session', opts.maxPerSession],
    ['run', opts.maxPerRun],
    ['hour', opts.maxPerHour],
  ];
  for (const [scope, limit] of checks) {
    if (limit === undefined) continue;
    const observed = resolver(scope, metadata);
    if (observed > limit) {
      if (onExceed === 'throw') {
        throw new CostBudgetExceededError({ scope, limit, observed });
      }
      logger(
        `[graphorin/provider] withCostLimit: ${scope} budget breach (${observed.toFixed(4)} > ${limit.toFixed(4)} USD).`,
        { scope, limit, observed },
      );
    }
  }
}

function defaultLogger(message: string, meta?: object): void {
  if (meta !== undefined) console.warn(message, meta);
  else console.warn(message);
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (value === undefined || value === null) return undefined;
  return value as Readonly<Record<string, unknown>>;
}
