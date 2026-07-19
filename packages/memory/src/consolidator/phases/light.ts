/**
 * Light phase - no LLM. Decays every fact's retention curve and
 * archives facts whose salience has fallen below the configured
 * threshold (plus the capacity pass). Noise filtering happens in
 * the standard phase where the batch is actually consumed - the old
 * advisory re-count here read the same unconsumed messages on every
 * pass for a counter nothing acted on.
 *
 * @packageDocumentation
 */

import type { SessionScope, Tracer } from '@graphorin/core';
import { withMemorySpan } from '../../internal/spans.js';
import type {
  ConsolidatorMemoryStoreExt,
  MemoryStoreAdapter,
} from '../../internal/storage-adapter.js';
import { type SalienceWeights, salience, selectForCapacityEviction } from '../decay.js';
import type { NoiseFilterPreset } from '../noise-filter.js';
import type { PhaseOutcome } from '../types.js';

/** Inputs accepted by {@link runLightPhase}. */
export interface LightPhaseDeps {
  readonly store: MemoryStoreAdapter;
  readonly consolidatorStore: ConsolidatorMemoryStoreExt | null;
  readonly tracer: Tracer;
  readonly scope: SessionScope;
  readonly now: () => number;
  readonly decayTauDays: number;
  readonly decayArchiveThreshold: number;
  /**
   * Capacity-bounded eviction. When non-null, the light phase
   * archives the lowest-salience live facts in the decay window down to
   * this many, in addition to the threshold archiving. `null` (the
   * default) leaves storage unbounded.
   */
  readonly decayCapacity: number | null;
  /** Weights for the multi-signal salience score. */
  readonly salienceWeights: SalienceWeights;
  readonly noiseFilters: ReadonlyArray<NoiseFilterPreset>;
  readonly maxBatchSize: number;
  readonly lastProcessedMessageId: string | null;
  /** The active consolidator tier - surfaced on the AISpan attribute. */
  readonly tier?: 'free' | 'cheap' | 'standard' | 'full' | 'custom';
}

/**
 * Run the light phase against the supplied scope.
 *
 * @stable
 */
export async function runLightPhase(deps: LightPhaseDeps): Promise<PhaseOutcome> {
  return withMemorySpan(
    deps.tracer,
    'memory.consolidate.light',
    deps.scope,
    {
      'consolidator.phase': 'light',
      'consolidator.tier': deps.tier ?? 'free',
    },
    async (span) => {
      const startedAt = deps.now();
      let facts = 0;
      let archived = 0;
      let capacityEvicted = 0;
      if (typeof deps.store.semantic.listForDecay === 'function') {
        // When a capacity bound is set we widen the decay window past the
        // batch size so there is always headroom to trim the overflow; the
        // window is the LRU head (ordered by last-accessed ASC), so the
        // bound converges over repeated passes.
        const decayLimit =
          deps.decayCapacity !== null
            ? Math.max(deps.maxBatchSize, deps.decayCapacity + deps.maxBatchSize)
            : deps.maxBatchSize;
        const rows = await deps.store.semantic.listForDecay(deps.scope, decayLimit);
        facts = rows.length;
        const now = deps.now();
        // Bind once so the optional method stays narrowed across `await`
        // (and keeps its `this`); `undefined` ⇒ the store can't archive.
        const archiveFact = deps.store.semantic.archiveFact?.bind(deps.store.semantic);
        // Pass 1 - multi-signal threshold archiving. Salience folds the
        // Ebbinghaus retention curve together with the P1-2 importance hint
        // and the P1-4 security-risk negative term, so a stale, low-value,
        // or quarantined fact crosses the threshold sooner. Neutral inputs
        // collapse salience to plain retention (pre-X-1 behaviour).
        const survivors: Array<{ id: string; salience: number }> = [];
        for (const row of rows) {
          if (row.archived) continue;
          const score = salience({
            now,
            lastAccessedAt: row.lastAccessedAt,
            createdAt: row.createdAt,
            strength: row.strength,
            tauDays: deps.decayTauDays,
            importance: row.importance,
            quarantined: row.status === 'quarantined',
            foreignProvenance: isForeignProvenance(row.provenance),
            // D3: retrieval-frequency reinforcement - inert at the
            // default weight 0; adapters without the column report 0.
            accessCount: row.accessCount ?? 0,
            weights: deps.salienceWeights,
          });
          if (score < deps.decayArchiveThreshold) {
            if (archiveFact !== undefined) {
              await archiveFact(row.id, 'low_salience');
              archived += 1;
            }
            continue;
          }
          survivors.push({ id: row.id, salience: score });
        }
        // Pass 2 - capacity-bounded eviction. Archive the lowest-salience
        // survivors (security-flagged first) until the window fits.
        if (deps.decayCapacity !== null && archiveFact !== undefined) {
          const evictIds = selectForCapacityEviction(survivors, deps.decayCapacity);
          for (const id of evictIds) {
            await archiveFact(id, 'capacity_exceeded');
            archived += 1;
            capacityEvicted += 1;
          }
        }
      }

      // MCON-17: the light phase no longer re-reads the unconsumed batch
      // just to produce an advisory dropped-count - the standard phase
      // filters where extraction actually consumes the messages.
      const noiseFilteredCount = 0;

      span.setAttributes({
        'consolidator.duration_ms': Math.max(0, deps.now() - startedAt),
        'consolidator.facts_extracted': 0,
        'consolidator.budget_used_usd': 0,
        'consolidator.light.facts_seen': facts,
        'consolidator.light.facts_archived': archived,
        'consolidator.light.capacity_evicted': capacityEvicted,
        'consolidator.light.noise_filtered': noiseFilteredCount,
      });

      return {
        phase: 'light',
        status: 'completed',
        factsCreated: 0,
        factsUpdated: archived,
        conflictsResolved: 0,
        episodesFormed: 0,
        insightsCreated: 0,
        noiseFilteredCount,
        emptyExtractions: 0,
        llmTokensUsed: 0,
        llmCostUsd: null,
        errorMessage: null,
      };
    },
  );
}

/**
 * `true` for provenance that did not originate first-party - used
 * to apply the mild salience penalty in capacity eviction. First-party
 * is `null` (legacy / direct write), `'user'`, and `'extraction'` (the
 * consolidator distilling the user's own session); `'tool'`,
 * `'imported'`, and `'reflection'` are treated as foreign.
 */
function isForeignProvenance(provenance: string | null): boolean {
  return provenance !== null && provenance !== 'user' && provenance !== 'extraction';
}
