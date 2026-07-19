/**
 * Head + tail sampling helpers. The tracer pairs the configured
 * sampler with a per-type override registry so chatty span types
 * (`memory.embed`, `tool.execute.partial`, …) can be downsampled
 * without affecting the rest of the trace stream. Under the default
 * `'parent-based'` decision maker the per-type rules apply to CHILDREN
 * of a sampled trace too - a rule can only downsample inside a
 * sampled trace, never resurrect children of an unsampled parent.
 *
 * @packageDocumentation
 */

import type { SpanType } from '@graphorin/core';

/** @stable */
export type SamplingDecisionMaker = 'parent-based' | 'always-on' | 'rate-limit';

/**
 * Per-span-type rate override. Applies on the probabilistic root path
 * AND to children of a sampled parent under `'parent-based'` -
 * `{ type: 'tool.execute', rate: 0.01 }` thins the per-call spans
 * inside every sampled `agent.run` trace. A child dropped by its rule
 * breaks the tree below it: its own descendants inherit
 * `parentSampled=false`.
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
   * Cap for the `'rate-limit'` decision maker: at most this many root spans
   * are sampled per rolling 1-second window. `undefined` ⇒ no cap
   * (samples everything); `0` ⇒ sample nothing. Ignored by the other
   * decision makers.
   */
  readonly maxPerSecond?: number;
  /**
   * Clock for the `'rate-limit'` window. Defaults to `Date.now`.
   *
   * @internal
   */
  readonly now?: () => number;
  /**
   * Optional override for streaming-event sampling.
   * @see the streaming event family `tool.execute.{progress,partial}`.
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
 * intentionally inexpensive - every decision boils down to a single
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
  const maxPerSecond = opts.maxPerSecond;
  const now = opts.now ?? Date.now;
  let windowStart: number | undefined;
  let windowCount = 0;

  return {
    shouldSample(type, parentSampled): boolean {
      if (decisionMaker === 'always-on') return true;
      if (decisionMaker === 'parent-based') {
        // RP-19: true parent-based - follow the parent's real sampling
        // decision. A child of an unsampled parent is NOT recorded (it would
        // otherwise be an orphan); a root span (no parent) falls through to
        // the rate.
        //
        // W-090: a per-type rule ACTS on children of a sampled parent -
        // that is where the volume lives (`tool.execute` inside a sampled
        // `agent.run` trace), and the docstring always promised it. A rule
        // never resurrects children of an UNSAMPLED parent (orphans); a
        // child dropped by its rule makes its own descendants inherit
        // parentSampled=false.
        if (parentSampled === true) {
          const rule = ruleByType.get(type);
          if (rule === undefined) return true;
          if (rule >= 1) return true;
          if (rule <= 0) return false;
          return random() < rule;
        }
        if (parentSampled === false) return false;
      }
      if (decisionMaker === 'rate-limit') {
        // RP-19: a real token-window limiter, distinct from the probabilistic
        // path. Caps sampled spans to `maxPerSecond` per rolling second.
        if (maxPerSecond === undefined) return true;
        if (maxPerSecond <= 0) return false;
        const t = now();
        if (windowStart === undefined || t - windowStart >= 1000) {
          windowStart = t;
          windowCount = 0;
        }
        if (windowCount < maxPerSecond) {
          windowCount += 1;
          return true;
        }
        return false;
      }
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
