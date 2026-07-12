/**
 * Deterministic extraction-stage scorers over operation-level gold
 * memory points (HaluMem-format): recall - how many gold `extract`
 * points made it into memory; precision - how many observed memory
 * points are grounded in *some* gold point. Staleness (an old value
 * surviving an update) is deliberately NOT a precision fault here -
 * it is measured by `memoryUpdateOmission`.
 *
 * @packageDocumentation
 */

import type { Scorer } from '@graphorin/observability/eval';

import type {
  MemoryOperationsEvalInput,
  MemoryOperationsObservation,
} from '../../loaders/memory-eval.js';
import { anyMatch, type MemoryPointMatcher, sampleList, tokenF1Matcher } from './util.js';

/** @stable */
export interface MemoryPointScorerOptions {
  /** Optional name override. */
  readonly name?: string;
  /** Custom gold-vs-observed matcher. Default: token-set F1 at {@link minTokenF1}. */
  readonly matcher?: MemoryPointMatcher;
  /** Threshold for the default token-F1 matcher. Default `0.5`. */
  readonly minTokenF1?: number;
  /** Metric value at or above which the case passes. Default `0.5`. */
  readonly passThreshold?: number;
}

/**
 * Extraction recall: `matched gold extract points / gold extract
 * points`. Vacuously passes (score `1`) when the case carries no
 * `extract` points.
 *
 * @stable
 */
export function memoryExtractionRecall(
  options: MemoryPointScorerOptions = {},
): Scorer<MemoryOperationsEvalInput, MemoryOperationsObservation> {
  const name = options.name ?? 'memory-extraction-recall';
  const matcher = options.matcher ?? tokenF1Matcher(options.minTokenF1);
  const passThreshold = options.passThreshold ?? 0.5;
  return {
    name,
    async score({ case: c, output }) {
      const gold = c.input.goldPoints.filter((p) => p.kind === 'extract');
      if (gold.length === 0) {
        return { pass: true, score: 1, metadata: { total: 0, reasonCode: 'no-gold-extract' } };
      }
      const observed = output.memoryPoints;
      const missed = gold.filter((p) => !anyMatch(p.content, observed, matcher));
      const matched = gold.length - missed.length;
      const score = matched / gold.length;
      const pass = score >= passThreshold;
      return {
        pass,
        score,
        ...(pass
          ? {}
          : { reason: `extraction recall ${score.toFixed(2)} < threshold ${passThreshold}` }),
        metadata: {
          matched,
          total: gold.length,
          missed: sampleList(missed.map((p) => p.content)),
        },
      };
    },
  };
}

/**
 * Extraction precision: `observed points grounded in some gold point /
 * observed points`. The grounded set includes every gold `content`
 * plus `update.previous` values (a not-yet-updated old value is
 * *stale*, not hallucinated). Vacuously passes when memory is empty.
 *
 * @stable
 */
export function memoryExtractionPrecision(
  options: MemoryPointScorerOptions = {},
): Scorer<MemoryOperationsEvalInput, MemoryOperationsObservation> {
  const name = options.name ?? 'memory-extraction-precision';
  const matcher = options.matcher ?? tokenF1Matcher(options.minTokenF1);
  const passThreshold = options.passThreshold ?? 0.5;
  return {
    name,
    async score({ case: c, output }) {
      const observed = output.memoryPoints;
      if (observed.length === 0) {
        return { pass: true, score: 1, metadata: { total: 0, reasonCode: 'no-observed-points' } };
      }
      const grounded: string[] = [];
      for (const point of c.input.goldPoints) {
        grounded.push(point.content);
        if (point.previous !== undefined) grounded.push(point.previous);
      }
      const hallucinated = observed.filter((o) => !anyMatch(o, grounded, (a, b) => matcher(b, a)));
      const matched = observed.length - hallucinated.length;
      const score = matched / observed.length;
      const pass = score >= passThreshold;
      return {
        pass,
        score,
        ...(pass
          ? {}
          : { reason: `extraction precision ${score.toFixed(2)} < threshold ${passThreshold}` }),
        metadata: {
          matched,
          total: observed.length,
          hallucinated: sampleList(hallucinated),
        },
      };
    },
  };
}
