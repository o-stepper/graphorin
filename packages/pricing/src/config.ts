/**
 * Configuration shapes consumed by `pricing.*`.
 *
 * @packageDocumentation
 */

/**
 * Auto-refresh configuration. The `enabled` flag exists in the type
 * for forward compatibility but is **enforced false** in v0.1 per the
 * zero-default-telemetry policy: refreshing the snapshot makes an
 * outbound HTTP call, so it must remain an explicit user action.
 *
 * @stable
 */
export interface PricingAutoRefreshConfig {
  /** Always `false` in v0.1. Reserved for v0.2+. */
  readonly enabled: false;
  /** Suggested cadence for v0.2+. Ignored at runtime in v0.1. */
  readonly intervalHours?: number;
}

/**
 * Default auto-refresh configuration.
 *
 * @stable
 */
export const DEFAULT_PRICING_AUTO_REFRESH: PricingAutoRefreshConfig = Object.freeze({
  enabled: false as const,
  intervalHours: 24,
});

/**
 * Container shape for the broader `pricing.*` configuration.
 *
 * @stable
 */
export interface PricingConfig {
  readonly autoRefresh?: PricingAutoRefreshConfig;
}
