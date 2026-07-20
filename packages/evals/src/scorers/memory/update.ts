/**
 * `memoryUpdateOmission` - deterministic update-stage scorer over
 * operation-level gold points (HaluMem-format). Grades whether
 * `update` / `delete` operations were actually applied:
 *
 *  - an `update` is applied when the NEW content is in memory AND the
 *    old (`previous`) content is gone;
 *  - a `delete` is applied when the content is gone.
 *
 * The omission rate is `1 - applied / total`; the score is the applied
 * fraction. This is the metric the conflict-pipeline A/B leg compares
 * (pipeline-on vs off), i.e. the value proof for the neighbour-aware
 * extract-reconcile-supersede path.
 *
 * Old and new values of an update naturally share most tokens ("lives
 * in Berlin" vs "lives in Kyiv"), so an observed point that matches
 * BOTH via the configured matcher is disambiguated by token-F1
 * proximity: it counts as whichever gold text it is closer to.
 *
 * @packageDocumentation
 */

import type { Scorer } from '@graphorin/observability/eval';

import type {
  MemoryOperationsEvalInput,
  MemoryOperationsObservation,
} from '../../loaders/memory-eval.js';
import {
  anyMatch,
  defaultMemoryPointMatcher,
  type MemoryPointMatcher,
  sampleList,
  tokenF1,
} from './util.js';

/** @stable */
export interface MemoryUpdateOmissionOptions {
  /** Optional name override. Default `'memory-update-omission'`. */
  readonly name?: string;
  /**
   * Custom gold-vs-observed matcher. Default:
   * {@link defaultMemoryPointMatcher} - token-set F1 OR directional
   * gold coverage.
   */
  readonly matcher?: MemoryPointMatcher;
  /** Threshold for the default matcher's F1 leg. Default `0.5`. */
  readonly minTokenF1?: number;
  /** Threshold for the default matcher's gold-coverage leg. Default `0.6`. */
  readonly minGoldCoverage?: number;
  /** Omission rate at or below which the case passes. Default `0.5`. */
  readonly maxOmissionRate?: number;
}

/**
 * Build the update-omission scorer. Vacuously passes (score `1`,
 * omission `0`) when the case carries no `update` / `delete` points.
 *
 * @stable
 */
export function memoryUpdateOmission(
  options: MemoryUpdateOmissionOptions = {},
): Scorer<MemoryOperationsEvalInput, MemoryOperationsObservation> {
  const name = options.name ?? 'memory-update-omission';
  const matcher =
    options.matcher ??
    defaultMemoryPointMatcher({
      minTokenF1: options.minTokenF1,
      minGoldCoverage: options.minGoldCoverage,
    });
  const maxOmissionRate = options.maxOmissionRate ?? 0.5;
  return {
    name,
    async score({ case: c, output }) {
      const gold = c.input.goldPoints.filter((p) => p.kind === 'update' || p.kind === 'delete');
      if (gold.length === 0) {
        return {
          pass: true,
          score: 1,
          metadata: { total: 0, omissionRate: 0, reasonCode: 'no-gold-updates' },
        };
      }
      const observed = output.memoryPoints;
      const omitted: string[] = [];
      const stale: string[] = [];
      for (const point of gold) {
        if (point.kind === 'delete') {
          if (anyMatch(point.content, observed, matcher)) {
            omitted.push(point.content);
            stale.push(point.content);
          }
          continue;
        }
        const previous = point.previous;
        let newPresent = false;
        let oldPresent = false;
        for (const candidate of observed) {
          const matchesNew = matcher(point.content, candidate);
          const matchesOld = previous !== undefined && matcher(previous, candidate);
          if (matchesNew && matchesOld) {
            // Ambiguous: attribute the point to the closer gold text.
            if (tokenF1(point.content, candidate) >= tokenF1(previous as string, candidate)) {
              newPresent = true;
            } else {
              oldPresent = true;
            }
          } else if (matchesNew) {
            newPresent = true;
          } else if (matchesOld) {
            oldPresent = true;
          }
        }
        if (oldPresent) stale.push(previous as string);
        if (!newPresent || oldPresent) omitted.push(point.content);
      }
      const applied = gold.length - omitted.length;
      const omissionRate = omitted.length / gold.length;
      const score = applied / gold.length;
      const pass = omissionRate <= maxOmissionRate;
      return {
        pass,
        score,
        ...(pass
          ? {}
          : {
              reason: `update omission ${omissionRate.toFixed(2)} > threshold ${maxOmissionRate}`,
            }),
        metadata: {
          applied,
          total: gold.length,
          omissionRate,
          omitted: sampleList(omitted),
          stale: sampleList(stale),
        },
      };
    },
  };
}
