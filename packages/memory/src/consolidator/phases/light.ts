/**
 * Light phase — no LLM. Decays every fact's retention curve, archives
 * facts whose retention has fallen below the configured threshold,
 * and runs the noise filter against any unread session messages so
 * the standard phase has a clean batch to extract from on the next
 * trigger.
 *
 * @packageDocumentation
 */

import type { SessionScope, Tracer } from '@graphorin/core';
import { withMemorySpan } from '../../internal/spans.js';
import type {
  ConsolidatorMemoryStoreExt,
  MemoryStoreAdapter,
  SessionMessageRecord,
} from '../../internal/storage-adapter.js';
import { shouldArchive } from '../decay.js';
import { tipMessageId } from '../idempotency.js';
import type { NoiseFilterPreset } from '../noise-filter.js';
import { applyNoiseFilters } from '../noise-filter.js';
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
  readonly noiseFilters: ReadonlyArray<NoiseFilterPreset>;
  readonly maxBatchSize: number;
  readonly lastProcessedMessageId: string | null;
  /** The active consolidator tier — surfaced on the AISpan attribute. */
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
      if (typeof deps.store.semantic.listForDecay === 'function') {
        const rows = await deps.store.semantic.listForDecay(deps.scope, deps.maxBatchSize);
        facts = rows.length;
        const now = deps.now();
        for (const row of rows) {
          if (row.archived) continue;
          const archive = shouldArchive({
            now,
            lastAccessedAt: row.lastAccessedAt,
            createdAt: row.createdAt,
            strength: row.strength,
            tauDays: deps.decayTauDays,
            archiveThreshold: deps.decayArchiveThreshold,
          });
          if (archive && typeof deps.store.semantic.archiveFact === 'function') {
            await deps.store.semantic.archiveFact(row.id, 'low_retention');
            archived += 1;
          }
        }
      }

      let noiseFilteredCount = 0;
      const session = deps.store.session;
      if (typeof session.listMessagesSince === 'function') {
        const batch = await session.listMessagesSince(
          deps.scope,
          deps.lastProcessedMessageId,
          deps.maxBatchSize,
        );
        const filtered = applyNoiseFilters(
          batch as ReadonlyArray<SessionMessageRecord>,
          deps.noiseFilters,
        );
        noiseFilteredCount = filtered.droppedCount;
      }

      span.setAttributes({
        'consolidator.duration_ms': Math.max(0, deps.now() - startedAt),
        'consolidator.facts_extracted': 0,
        'consolidator.budget_used_usd': 0,
        'consolidator.light.facts_seen': facts,
        'consolidator.light.facts_archived': archived,
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

/** Convenience helper used by the standard phase to advance the cursor. */
export function nextCursor(batch: ReadonlyArray<SessionMessageRecord>): string | null {
  return tipMessageId(batch);
}
