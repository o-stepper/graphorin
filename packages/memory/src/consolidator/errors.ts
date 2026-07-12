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
      `[graphorin/memory] consolidator budget exceeded - phase=${args.phase} resource=${args.resource} actual=${args.actual} budget=${args.budget}`,
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
      `[graphorin/memory] tier='custom' requires explicit ceilings - missing: ${missing.join(', ')}`,
      {
        hint: 'Set `ceilings.maxTokensPerDay` + `ceilings.maxCostPerDay` (and `cheapModel` / `deepModel` if those phases are enabled).',
      },
    );
    this.missing = Object.freeze([...missing]);
  }
}

/**
 * Raised when the wave-D D3 `curatedBlocks` config is invalid: a
 * duplicate label (incl. colliding with the `learnedContext: true`
 * sugar), an empty label, or the reserved `profile` label (the profile
 * projection owns that block and keeps it read-only - a curated-block
 * rewrite would fight the projection).
 *
 * @stable
 */
export class CuratedBlocksMisconfiguredError extends GraphorinMemoryError {
  override readonly name = 'CuratedBlocksMisconfiguredError';
  readonly kind = 'curated-blocks-misconfigured' as const;
  readonly label: string;

  constructor(label: string, problem: 'duplicate' | 'empty' | 'reserved') {
    super(
      problem === 'duplicate'
        ? `[graphorin/memory] curatedBlocks: duplicate label '${label}' (note: learnedContext: true already registers 'learned_context').`
        : problem === 'empty'
          ? '[graphorin/memory] curatedBlocks: a block label must be a non-empty string.'
          : `[graphorin/memory] curatedBlocks: label '${label}' is reserved - the profile projection owns it (read-only).`,
      {
        hint: 'Give every curated block a unique, non-reserved label.',
      },
    );
    this.label = label;
  }
}

/**
 * Raised at `createMemory` time when an auto-promotion feature is
 * enabled without the B3 ingest gate (wave-D D4, fail-closed): both
 * the deterministic promotion step and the write-time
 * `autoPromoteExtraction` hatch move synthesized content into default
 * recall, so they REQUIRE the admission gate as configured evidence -
 * the same posture as the proactive `act` grant.
 *
 * @stable
 */
export class IngestGateRequiredError extends GraphorinMemoryError {
  override readonly name = 'IngestGateRequiredError';
  readonly kind = 'ingest-gate-required' as const;
  readonly feature: 'promotion' | 'autoPromoteExtraction';

  constructor(feature: 'promotion' | 'autoPromoteExtraction') {
    super(
      `[graphorin/memory] '${feature}' requires an ingest gate - auto-promotion without the B3 ` +
        'admission gate would move unvetted content into default recall (fail-closed).',
      {
        hint: 'Pass createMemory({ ingestGate: verdictIngestGate }) (or your own gate) alongside the promotion feature.',
      },
    );
    this.feature = feature;
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
