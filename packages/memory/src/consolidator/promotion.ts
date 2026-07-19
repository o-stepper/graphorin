/**
 * Deterministic promotion policy - the
 * closed loop's exit from quarantine: a quarantined fact whose
 * demonstrated usage clears every configured threshold is promoted to
 * `active` through the audited `SemanticMemory.validate` path (which
 * also completes any pending supersede). Pure function, no I/O -
 * the consolidator's deep phase feeds it candidates and executes the
 * verdicts.
 *
 * Distinct from the write-time `autoPromoteExtraction` escape hatch:
 * that one skips quarantine at WRITE time (and requires the ingest
 * gate as evidence); this policy promotes at CONSOLIDATION time from
 * accumulated recall evidence. Default OFF.
 *
 * Evidence sources: `accessCount` is the monotonic recall counter
 * (migration 027); `uniqueQueryCount` the distinct-query ledger
 * (migration 036). Note default recall excludes quarantined facts -
 * the counters accumulate through quarantine-inclusive surfaces
 * (validation / inspector reads, `deep_recall`), so with the default
 * thresholds promotion follows demonstrated review usage. A bot that
 * wants age + salience-only promotion sets `minRecalls: 0,
 * minUniqueQueries: 0` explicitly.
 *
 * @packageDocumentation
 */

import type { Fact, MemoryProvenance } from '@graphorin/core';

/**
 * Threshold configuration - `createMemory({ consolidator: {
 * promotion } })`. Every configured threshold must pass (AND).
 *
 * @stable
 */
export interface PromotionPolicyConfig {
  /** Minimum `importance` (salience hint) in `[0, 1]`. Default `0` (off). */
  readonly minSalience?: number;
  /** Minimum total recalls (migration-027 counter). Default `3`. */
  readonly minRecalls?: number;
  /** Minimum DISTINCT recall queries (migration-036 ledger). Default `2`. */
  readonly minUniqueQueries?: number;
  /** Minimum age since the fact was written, in ms. Default 24h. */
  readonly minAgeMs?: number;
  /**
   * Provenances eligible for promotion. Default: `['extraction',
   * 'reflection', 'induction']` - synthesized content only; `'tool'` /
   * `'imported'` provenance never auto-promotes unless listed
   * explicitly.
   */
  readonly allowedProvenance?: ReadonlyArray<MemoryProvenance>;
  /** Upper bound on promotions per deep pass. Default `10`. */
  readonly maxPerRun?: number;
}

/** Resolved (defaulted) policy. */
export interface ResolvedPromotionPolicy {
  readonly minSalience: number;
  readonly minRecalls: number;
  readonly minUniqueQueries: number;
  readonly minAgeMs: number;
  readonly allowedProvenance: ReadonlyArray<MemoryProvenance>;
  readonly maxPerRun: number;
}

/** Apply defaults. */
export function resolvePromotionPolicy(config: PromotionPolicyConfig): ResolvedPromotionPolicy {
  return Object.freeze({
    minSalience: config.minSalience ?? 0,
    minRecalls: config.minRecalls ?? 3,
    minUniqueQueries: config.minUniqueQueries ?? 2,
    minAgeMs: config.minAgeMs ?? 24 * 60 * 60 * 1000,
    allowedProvenance: Object.freeze([
      ...(config.allowedProvenance ?? (['extraction', 'reflection', 'induction'] as const)),
    ]),
    maxPerRun: config.maxPerRun ?? 10,
  });
}

/** One candidate as fed by `listPromotionCandidates`. */
export interface PromotionCandidate {
  readonly fact: Fact;
  readonly accessCount: number;
  readonly uniqueQueryCount: number;
}

/**
 * The pure verdict: does this candidate clear every threshold at
 * `nowMs`? No I/O, no clock reads.
 *
 * @stable
 */
export function shouldPromote(
  candidate: PromotionCandidate,
  policy: ResolvedPromotionPolicy,
  nowMs: number,
): boolean {
  const fact = candidate.fact;
  if (fact.status !== 'quarantined') return false;
  const provenance = fact.provenance ?? 'extraction';
  if (!policy.allowedProvenance.includes(provenance)) return false;
  if ((fact.importance ?? 0) < policy.minSalience) return false;
  if (candidate.accessCount < policy.minRecalls) return false;
  if (candidate.uniqueQueryCount < policy.minUniqueQueries) return false;
  const createdAtMs = Date.parse(fact.createdAt);
  if (!Number.isFinite(createdAtMs) || nowMs - createdAtMs < policy.minAgeMs) return false;
  return true;
}
