/**
 * `MergeAgentSidewaysInjectionGuard` - layered on top of the
 * `Agent.fanOut(...)` `'judge-merge'` strategy. Computes a
 * per-child `sourceTrust` score in `[0.0, 1.0]` and flags merges
 * where a low-trust child's contribution-weight exceeds the
 * configured `maxLowTrustWeight` threshold.
 *
 * @packageDocumentation
 */

/**
 * Trust-class baseline used by the guard's `sourceTrust`
 * computation. Mirrors the DEC-149 trust-class taxonomy from
 * `@graphorin/provider`.
 *
 * @stable
 */
export type TrustClass = 'loopback' | 'public-tls' | 'public-mtls' | 'untrusted-skill';

const TRUST_CLASS_BASELINE: Record<TrustClass, number> = {
  loopback: 0.9,
  'public-tls': 0.7,
  'public-mtls': 0.8,
  'untrusted-skill': 0.3,
};

/**
 * Tool-source provenance multiplier. Mirrors the `ContentOrigin`
 * annotation from `@graphorin/memory.context-engine`.
 *
 * @stable
 */
export type ContentOriginKind =
  | 'built-in'
  | 'user-defined'
  | 'trusted-skill'
  | 'untrusted-skill'
  | 'mcp'
  | 'web-search';

const ORIGIN_MULTIPLIER: Record<ContentOriginKind, number> = {
  'built-in': 1.0,
  'user-defined': 0.9,
  'trusted-skill': 0.85,
  'untrusted-skill': 0.4,
  mcp: 0.7,
  'web-search': 0.5,
};

/**
 * Per-agent guard configuration accepted by
 * `createAgent({ mergeGuard })`.
 *
 * @stable
 */
export interface MergeGuardConfig {
  readonly strictness: 'off' | 'detect' | 'detect-and-flag' | 'detect-and-block';
  /** Default `0.3`. */
  readonly maxLowTrustWeight?: number;
  /** Default `0.5`. */
  readonly lowTrustThreshold?: number;
  /** Operator overrides for known agent ids. */
  readonly sourceTrustOverrides?: Readonly<Record<string, number>>;
}

/**
 * Per-child input descriptor for {@link computeSourceTrust}.
 *
 * @stable
 */
export interface ChildTrustInput {
  readonly agentId: string;
  readonly trustClass: TrustClass;
  readonly origin: ContentOriginKind;
  /** Rolling trust score in `[0.0, 1.0]`. Defaults to `1.0`. */
  readonly historyAdjustment?: number;
}

/**
 * Compose `baseline * provenance * historyAdjustment` and clamp.
 *
 * @stable
 */
export function computeSourceTrust(
  input: ChildTrustInput,
  overrides: Readonly<Record<string, number>> = {},
): number {
  const override = overrides[input.agentId];
  if (override !== undefined) return Math.max(0, Math.min(1, override));
  const baseline = TRUST_CLASS_BASELINE[input.trustClass];
  const provenance = ORIGIN_MULTIPLIER[input.origin];
  const history = input.historyAdjustment ?? 1.0;
  return Math.max(0, Math.min(1, baseline * provenance * history));
}

/**
 * Pure decision returned by {@link evaluateMerge}.
 *
 * @stable
 */
export interface MergeBiasDecision {
  readonly biased: boolean;
  readonly offendingChild?: string;
  readonly contributionWeight?: number;
  readonly sourceTrust?: number;
  readonly decision: 'pass-through' | 'flag' | 'block';
}

/**
 * Evaluate whether the merge is biased - a child with
 * `sourceTrust < lowTrustThreshold` contributing more than
 * `maxLowTrustWeight` of the merged output.
 *
 * Inputs are pre-computed per-child trust scores together with the
 * estimated contribution weights (token-count overlap between each
 * child's output and the merged output, normalized to sum to ~1.0).
 *
 * @stable
 */
export function evaluateMerge(
  perChild: ReadonlyArray<{
    readonly agentId: string;
    readonly sourceTrust: number;
    readonly contributionWeight: number;
  }>,
  cfg: MergeGuardConfig,
): MergeBiasDecision {
  if (cfg.strictness === 'off') {
    return { biased: false, decision: 'pass-through' };
  }
  const lowTrustThreshold = cfg.lowTrustThreshold ?? 0.5;
  const maxLowTrustWeight = cfg.maxLowTrustWeight ?? 0.3;
  for (const child of perChild) {
    if (child.sourceTrust < lowTrustThreshold && child.contributionWeight > maxLowTrustWeight) {
      const decision: MergeBiasDecision['decision'] =
        cfg.strictness === 'detect-and-block'
          ? 'block'
          : cfg.strictness === 'detect-and-flag'
            ? 'flag'
            : 'pass-through';
      return {
        biased: true,
        offendingChild: child.agentId,
        contributionWeight: child.contributionWeight,
        sourceTrust: child.sourceTrust,
        decision,
      };
    }
  }
  return { biased: false, decision: 'pass-through' };
}
