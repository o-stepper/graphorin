/**
 * Typed errors raised by the Phase 10c consolidator runtime. Every
 * error carries a stable lowercase `kind` discriminator so downstream
 * tooling can pattern-match without parsing the prose.
 *
 * @packageDocumentation
 */

import { GraphorinMemoryError } from '../errors/index.js';
import type { ConsolidatorPhase } from './types.js';

/**
 * Raised when the consolidator's daily budget envelope is exhausted
 * and `onExceed: 'throw'` is in effect.
 *
 * @stable
 */
export class BudgetExceededError extends GraphorinMemoryError {
  override readonly name = 'BudgetExceededError';
  readonly kind = 'budget-exceeded' as const;
  readonly phase: ConsolidatorPhase;
  readonly budget: number;
  readonly actual: number;
  readonly resource: 'tokens' | 'cost';

  constructor(args: {
    phase: ConsolidatorPhase;
    budget: number;
    actual: number;
    resource: 'tokens' | 'cost';
  }) {
    super(
      `[graphorin/memory] consolidator budget exceeded — phase=${args.phase} resource=${args.resource} actual=${args.actual} budget=${args.budget}`,
      { hint: 'Pass `onExceed: "log"` to keep running, or upgrade the tier ceilings.' },
    );
    this.phase = args.phase;
    this.budget = args.budget;
    this.actual = args.actual;
    this.resource = args.resource;
  }
}

/**
 * Raised when `tier: 'custom'` is selected without explicit
 * `ceilings.maxTokensPerDay` / `ceilings.maxCostPerDay`. Custom is
 * an explicit-only escape hatch.
 *
 * @stable
 */
export class CustomTierMisconfiguredError extends GraphorinMemoryError {
  override readonly name = 'CustomTierMisconfiguredError';
  readonly kind = 'custom-tier-misconfigured' as const;
  readonly missing: ReadonlyArray<string>;

  constructor(missing: ReadonlyArray<string>) {
    super(
      `[graphorin/memory] tier='custom' requires explicit ceilings — missing: ${missing.join(', ')}`,
      {
        hint: 'Set `ceilings.maxTokensPerDay` + `ceilings.maxCostPerDay` (and `cheapModel` / `deepModel` if those phases are enabled).',
      },
    );
    this.missing = Object.freeze([...missing]);
  }
}

/**
 * Raised when the standard / deep phase attempts an LLM call without
 * a configured provider. Surfaces as a typed failure that the DLQ
 * pipeline can attribute correctly.
 *
 * @stable
 */
export class ProviderNotConfiguredError extends GraphorinMemoryError {
  override readonly name = 'ProviderNotConfiguredError';
  readonly kind = 'provider-not-configured' as const;
  readonly phase: ConsolidatorPhase;

  constructor(phase: ConsolidatorPhase) {
    super(
      `[graphorin/memory] consolidator phase '${phase}' requires a provider but none was supplied.`,
      {
        hint: 'Pass `provider` to createConsolidator({...}) or pin tier="free" to skip LLM phases.',
      },
    );
    this.phase = phase;
  }
}
