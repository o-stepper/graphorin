/**
 * Head + tail sampling helpers. The tracer pairs the configured
 * sampler with a per-type override registry so chatty span types
 * (`memory.embed`, `tool.execute.partial`, …) can be downsampled
 * without affecting the rest of the trace stream.
 *
 * @packageDocumentation
 */

import type { SpanType } from '@graphorin/core';

/** @stable */
export type SamplingDecisionMaker = 'parent-based' | 'always-on' | 'rate-limit';

/**
 * Per-span-type rate override.
 *
 * @stable
 */
export interface SamplingRule {
  readonly type: SpanType | string;
  readonly rate: number;
}

/**
 * Configuration shape consumed by {@link createSampler}.
 *
 * @stable
 */
export interface SamplingOptions {
  /** Default head-sampling rate. Must be in `[0, 1]`. Defaults to `1.0`. */
  readonly rate?: number;
  /** Per-type overrides. Last write wins on duplicate `type`. */
  readonly rules?: ReadonlyArray<SamplingRule>;
  /** Decision maker. Defaults to `'parent-based'`. */
  readonly decisionMaker?: SamplingDecisionMaker;
  /**
   * Optional override for streaming-event sampling.
   * @see RB-52 — streaming event family `tool.execute.{progress,partial}`.
   */
  readonly streaming?: {
    readonly eventSamplingRate?: number;
    readonly includeChunkContent?: 'none' | 'text-only' | 'all';
  };
  /**
   * Override for the random source. Useful for deterministic tests.
   *
   * @internal
   */
  readonly random?: () => number;
}

/**
 * @stable
 */
export interface Sampler {
  /** Decide whether a span of the given type should be recorded. */
  shouldSample(type: SpanType | string, parentSampled?: boolean): boolean;
  /** Decide whether a span event of the given name should be recorded. */
  shouldRecordEvent(name: string): boolean;
  /** Returns whether chunk *content* should travel through the exporter. */
  shouldIncludeChunkContent(): boolean;
}

/**
 * Build a {@link Sampler} from the supplied options. The sampler is
 * intentionally inexpensive — every decision boils down to a single
 * `random < threshold` comparison.
 *
 * @stable
 */
export function createSampler(opts: SamplingOptions = {}): Sampler {
  const baseRate = clampRate(opts.rate ?? 1.0);
  const decisionMaker: SamplingDecisionMaker = opts.decisionMaker ?? 'parent-based';
  const ruleByType = new Map<string, number>();
  for (const rule of opts.rules ?? []) {
    ruleByType.set(rule.type, clampRate(rule.rate));
  }
  const streamingRate = clampRate(opts.streaming?.eventSamplingRate ?? 1.0);
  const includeChunks = opts.streaming?.includeChunkContent ?? 'none';
  const random = opts.random ?? Math.random;

  return {
    shouldSample(type, parentSampled): boolean {
      if (decisionMaker === 'always-on') return true;
      if (decisionMaker === 'parent-based' && parentSampled === true) return true;
      const rate = ruleByType.get(type) ?? baseRate;
      if (rate >= 1) return true;
      if (rate <= 0) return false;
      return random() < rate;
    },
    shouldRecordEvent(name): boolean {
      const rate = ruleByType.get(name) ?? streamingRate;
      if (rate >= 1) return true;
      if (rate <= 0) return false;
      return random() < rate;
    },
    shouldIncludeChunkContent(): boolean {
      return includeChunks !== 'none';
    },
  };
}

function clampRate(rate: number): number {
  if (Number.isNaN(rate)) return 1;
  if (rate < 0) return 0;
  if (rate > 1) return 1;
  return rate;
}
