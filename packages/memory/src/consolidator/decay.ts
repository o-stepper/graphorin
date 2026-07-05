/**
 * Ebbinghaus retention curve for the light phase. Pure functions so
 * the formula is testable without touching storage.
 *
 * @packageDocumentation
 */

/**
 * Default time constant for the retention curve. The plan calls for
 * `tau = 7` days; consumers may override per-consolidator via
 * `decayTauDays`.
 *
 * @stable
 */
export const DEFAULT_DECAY_TAU_DAYS = 7;

/**
 * Default archive threshold - facts whose retention falls below this
 * value are soft-archived in the light phase. `0.05` matches the
 * documented forgetting policy for the memory system.
 *
 * @stable
 */
export const DEFAULT_DECAY_ARCHIVE_THRESHOLD = 0.05;

/**
 * Compute the retention score for a fact given its age, last-access
 * recency, and accumulated `strength`. Larger `strength` means the
 * fact has been accessed more often, so the retention curve flattens
 * - `score = base * exp(-elapsedDays / (tau * strength))`.
 *
 * @stable
 */
export function retention(args: {
  /** Reference time (ms epoch). */
  readonly now: number;
  /** Last access timestamp (ms epoch); falls back to `createdAt` when null. */
  readonly lastAccessedAt: number | null;
  /** Creation timestamp (ms epoch). */
  readonly createdAt: number;
  /** Strength multiplier (default 1.0). */
  readonly strength: number;
  /** Time constant in days. */
  readonly tauDays: number;
}): number {
  const reference = args.lastAccessedAt ?? args.createdAt;
  const elapsedMs = Math.max(0, args.now - reference);
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const tau = Math.max(0.1, args.tauDays * Math.max(0.5, args.strength));
  return Math.exp(-elapsedDays / tau);
}

/**
 * `true` when the fact's retention curve has fallen below the
 * archive threshold.
 *
 * @stable
 */
export function shouldArchive(args: {
  readonly now: number;
  readonly lastAccessedAt: number | null;
  readonly createdAt: number;
  readonly strength: number;
  readonly tauDays: number;
  readonly archiveThreshold: number;
}): boolean {
  const score = retention({
    now: args.now,
    lastAccessedAt: args.lastAccessedAt,
    createdAt: args.createdAt,
    strength: args.strength,
    tauDays: args.tauDays,
  });
  return score < args.archiveThreshold;
}

/**
 * Neutral importance used when a fact carries no importance hint -
 * the midpoint of the `[0, 1]` range, so an unscored fact contributes
 * an importance factor of exactly `1.0` (`salience === retention`).
 *
 * @stable
 */
export const NEUTRAL_IMPORTANCE = 0.5;

/**
 * Tunable weights for the multi-signal {@link salience} score (X-1).
 * Each weight is the *magnitude* of the corresponding signal's pull on
 * the retention curve; all default to values chosen so the ordering is
 * sensible without ever inverting it.
 *
 * @stable
 */
export interface SalienceWeights {
  /**
   * How strongly importance (P1-2) stretches retention. At the default
   * `0.6`, importance `1.0` multiplies retention by `1.3` and importance
   * `0.0` by `0.7`; neutral importance leaves it unchanged.
   */
  readonly importance: number;
  /**
   * Penalty applied to a **quarantined** fact (P1-4) - the explicit
   * security-risk negative term. At the default `0.7`, a quarantined
   * fact keeps only `0.3` of its retention, so it is evicted first under
   * capacity pressure. Never a hard delete: the fact is archived,
   * recoverable, and quarantine still gates it out of recall meanwhile.
   */
  readonly quarantine: number;
  /**
   * Mild penalty for a fact with non-first-party provenance (P1-4) -
   * e.g. `'tool'` / `'imported'` content that did not originate with the
   * user. At the default `0.2` such a fact keeps `0.8` of its retention.
   */
  readonly foreignProvenance: number;
  /**
   * Retrieval-frequency reinforcement (D3) - the use-it-or-lose-it
   * signal. How strongly the monotonic access counter stretches
   * retention: the factor is
   * `1 + weight * min(1, log1p(count) / log1p(saturation))`, saturating
   * at {@link ACCESS_REINFORCEMENT_SATURATION} accesses. At the default
   * `0` the factor is exactly `1` - behaviour is byte-identical until an
   * operator opts in (e.g. `0.3` ⇒ a heavily-used fact keeps up to 1.3x
   * its retention). Optional so existing weight literals stay valid.
   */
  readonly accessReinforcement?: number;
}

/**
 * Access count at which retrieval-frequency reinforcement saturates
 * (D3). `log1p`-scaled, so the first few accesses matter most and
 * anything past this count contributes the full weight.
 *
 * @stable
 */
export const ACCESS_REINFORCEMENT_SATURATION = 32;

/**
 * Default {@link SalienceWeights}. Chosen so that an active,
 * first-party, unscored fact has `salience === retention` (the X-1
 * change is invisible until a fact carries an importance hint, is
 * quarantined, or has foreign provenance).
 *
 * @stable
 */
export const DEFAULT_SALIENCE_WEIGHTS: SalienceWeights = Object.freeze({
  importance: 0.6,
  quarantine: 0.7,
  foreignProvenance: 0.2,
  // D3: reinforcement is opt-in - the default weight 0 keeps salience
  // byte-identical for every fact regardless of its access count.
  accessReinforcement: 0,
});

/**
 * Multi-signal salience for capacity-bounded forgetting (X-1). Combines
 * the Ebbinghaus {@link retention} curve (temporal relevance + access
 * frequency via `strength`) with the P1-2 importance hint and a P1-4
 * security-risk negative term:
 *
 * ```
 * salience = retention × importanceFactor × securityFactor
 * ```
 *
 * Sold as **cost / staleness control, not accuracy**: it only orders
 * what gets archived first when storage is bounded - it never gates
 * recall. With neutral importance, an active fact, and first-party
 * provenance the factors are all `1`, so `salience === retention`.
 *
 * @stable
 */
export function salience(args: {
  readonly now: number;
  readonly lastAccessedAt: number | null;
  readonly createdAt: number;
  readonly strength: number;
  readonly tauDays: number;
  /** Importance hint in `[0, 1]`; `null` → {@link NEUTRAL_IMPORTANCE}. */
  readonly importance: number | null;
  /** P1-4: a quarantined fact gets the {@link SalienceWeights.quarantine} penalty. */
  readonly quarantined: boolean;
  /** P1-4: a non-first-party fact gets the {@link SalienceWeights.foreignProvenance} penalty. */
  readonly foreignProvenance: boolean;
  /**
   * Monotonic retrieval-access count (D3); `null` / absent ⇒ `0`.
   * Contributes only when {@link SalienceWeights.accessReinforcement}
   * is non-zero (the default `0` keeps salience unchanged).
   */
  readonly accessCount?: number | null;
  /** Defaults to {@link DEFAULT_SALIENCE_WEIGHTS}. */
  readonly weights?: SalienceWeights;
}): number {
  const weights = args.weights ?? DEFAULT_SALIENCE_WEIGHTS;
  const base = retention({
    now: args.now,
    lastAccessedAt: args.lastAccessedAt,
    createdAt: args.createdAt,
    strength: args.strength,
    tauDays: args.tauDays,
  });
  const importance = clamp01(args.importance ?? NEUTRAL_IMPORTANCE);
  const importanceFactor = Math.max(0, 1 + weights.importance * (importance - NEUTRAL_IMPORTANCE));
  const securityFactor = args.quarantined
    ? Math.max(0, 1 - weights.quarantine)
    : args.foreignProvenance
      ? Math.max(0, 1 - weights.foreignProvenance)
      : 1;
  // D3: use-it-or-lose-it reinforcement. log1p-saturating in the access
  // count so early accesses matter most; identity at the default weight 0.
  const reinforcementWeight = weights.accessReinforcement ?? 0;
  const count = Math.max(0, args.accessCount ?? 0);
  const reinforcementFactor =
    reinforcementWeight === 0
      ? 1
      : 1 +
        reinforcementWeight *
          Math.min(1, Math.log1p(count) / Math.log1p(ACCESS_REINFORCEMENT_SATURATION));
  return Math.max(0, base * importanceFactor * securityFactor * reinforcementFactor);
}

/**
 * Capacity-bounded eviction selector (X-1). Given facts scored by
 * {@link salience}, return the ids of the lowest-salience ones to
 * archive so that at most `capacity` remain. Pure and deterministic:
 * ties break by id so a given batch always evicts the same set.
 *
 * Returns `[]` when the batch already fits (`length <= capacity`).
 * `capacity <= 0` evicts the whole batch.
 *
 * @stable
 */
export function selectForCapacityEviction(
  scored: ReadonlyArray<{ readonly id: string; readonly salience: number }>,
  capacity: number,
): ReadonlyArray<string> {
  const evictCount = scored.length - Math.max(0, capacity);
  if (evictCount <= 0) return [];
  return [...scored]
    .sort((a, b) => a.salience - b.salience || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, evictCount)
    .map((row) => row.id);
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return NEUTRAL_IMPORTANCE;
  return Math.min(1, Math.max(0, value));
}
