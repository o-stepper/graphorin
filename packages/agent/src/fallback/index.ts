/**
 * Agent-level model fallback chain primitives.
 *
 * The agent runtime walks `[primaryModel, ...Agent.fallbackModels]`
 * on fallback-eligible errors during the per-step provider call.
 * `isAgentFallbackEligible(...)` is the pure decision function the
 * runtime calls once per `ProviderError`.
 *
 * Layering: this module is the **agent-step-level** fallback
 * (re-tries the whole step against a different model on rate-limit
 * / capacity / context-length / transient errors). The
 * **request-level** `withFallback` provider middleware
 * (`@graphorin/provider`) is a separate concern — it retries against
 * an alternate provider serving the **same** model concept on
 * transient errors inside one `provider.stream(...)` call.
 *
 * @packageDocumentation
 */

import type { ProviderError } from '@graphorin/core';

/**
 * Operator-supplied policy that lets the consumer toggle which
 * `ProviderError` kinds the agent runtime should consider eligible
 * for whole-step retries against the next model in the chain.
 *
 * @stable
 */
export interface AgentFallbackPolicy {
  /** Default `true`. */
  readonly rateLimitEligible?: boolean;
  /** Default `true`. */
  readonly capacityEligible?: boolean;
  /** Default `true`. */
  readonly contextLengthEligible?: boolean;
  /** Default `false` — `withRetry` already covers transient errors. */
  readonly transientEligible?: boolean;
}

/**
 * Stable taxonomy returned by {@link isAgentFallbackEligible} on
 * eligible errors.
 *
 * @stable
 */
export type AgentFallbackReason = 'rate-limit' | 'capacity' | 'context-length' | 'transient';

/**
 * Outcome of {@link isAgentFallbackEligible}.
 *
 * @stable
 */
export interface AgentFallbackEligibility {
  readonly eligible: boolean;
  readonly reason?: AgentFallbackReason;
}

const DEFAULT_POLICY: Required<AgentFallbackPolicy> = {
  rateLimitEligible: true,
  capacityEligible: true,
  contextLengthEligible: true,
  transientEligible: false,
};

/**
 * Pure dispatcher that maps a {@link ProviderError} to one of four
 * eligible reasons or to `eligible: false` if the error is on the
 * bypass list (`auth | invalid-input | content-filter | cancelled`).
 *
 * The function is intentionally allocation-free on the hot path so
 * the agent runtime can call it once per provider error per step
 * without budget concerns.
 *
 * @stable
 */
export function isAgentFallbackEligible(
  error: ProviderError,
  policy: AgentFallbackPolicy = {},
): AgentFallbackEligibility {
  const merged: Required<AgentFallbackPolicy> = { ...DEFAULT_POLICY, ...policy };
  switch (error.kind) {
    case 'rate-limit':
      return merged.rateLimitEligible
        ? { eligible: true, reason: 'rate-limit' }
        : { eligible: false };
    case 'capacity':
      return merged.capacityEligible ? { eligible: true, reason: 'capacity' } : { eligible: false };
    case 'context-length':
      return merged.contextLengthEligible
        ? { eligible: true, reason: 'context-length' }
        : { eligible: false };
    case 'transient':
      return merged.transientEligible
        ? { eligible: true, reason: 'transient' }
        : { eligible: false };
    case 'invalid-request':
    case 'unauthorized':
    case 'content-filter':
    case 'unknown':
      return { eligible: false };
    default: {
      // Defensive: unknown error kind treated as ineligible.
      const _exhaustive: never = error.kind;
      void _exhaustive;
      return { eligible: false };
    }
  }
}
