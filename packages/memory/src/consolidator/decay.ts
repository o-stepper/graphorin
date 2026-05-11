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
 * Default archive threshold — facts whose retention falls below this
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
 * — `score = base * exp(-elapsedDays / (tau * strength))`.
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
