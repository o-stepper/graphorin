/**
 * Per-tool / per-agent preferred-model resolution. Pure functions
 * consulted by the agent loop AFTER the model has decided which
 * tool(s) to call but BEFORE `provider.stream(...)` is invoked.
 *
 * The four-step precedence ladder (highest wins):
 *
 *   1. `prepareStep({ provider })` - the operator's explicit per-step
 *      override always wins.
 *   2. `Tool.preferredModel`        - the tool author's per-tool hint.
 *      Only the tools the model actually CALLED on the previous step
 *      are consulted (AG-15) - an advertised-but-uncalled hint never
 *      escalates the run. Multi-tool ties resolve to the highest cost
 *      tier (`'smart' > 'balanced' > 'fast'`; explicit `ModelSpec` is
 *      treated as the highest tier).
 *   3. `Agent.preferredModel?`      - the per-agent default.
 *   4. `Agent` default `provider`   - the v0.1-alpha behaviour.
 *
 * Cost-tier resolution against `Agent.modelTierMap` is documented
 * as a hint: when the requested tier is unmapped, the resolver
 * falls through to the next precedence step rather than throwing.
 *
 * @packageDocumentation
 */

import type { ModelHint, ModelSpec, Provider } from '@graphorin/core';

const TIER_ORDER: Record<ModelHint, number> = { fast: 0, balanced: 1, smart: 2 };

/**
 * Result returned by {@link resolvePreferredModel}.
 *
 * @stable
 */
export interface PreferredModelResolution {
  readonly resolvedProvider: Provider;
  readonly resolvedModelId: string;
  readonly source: 'prepare-step' | 'tier-map' | 'spec' | 'agent-preferred' | 'fallthrough-default';
  readonly hintApplied?: ModelHint;
  readonly fallthroughReason?:
    | 'tier-not-mapped'
    | 'provider-unavailable'
    | 'override-takes-precedence';
}

/**
 * Pure inputs to {@link resolvePreferredModel}.
 *
 * @stable
 */
export interface ResolvePreferredModelInput {
  readonly prepareStepProvider?: Provider;
  readonly toolPreferredModels: ReadonlyArray<ModelHint | ModelSpec | undefined>;
  readonly agentPreferredModel?: ModelHint | ModelSpec;
  readonly agentDefaultProvider: Provider;
  readonly modelTierMap?: Partial<Record<ModelHint, ModelSpec>>;
}

function isModelHint(value: ModelHint | ModelSpec | undefined): value is ModelHint {
  return value === 'fast' || value === 'balanced' || value === 'smart';
}

function specToProvider(spec: ModelSpec): Provider {
  if ('provider' in spec) return spec.provider as Provider;
  return spec as Provider;
}

function modelIdFromSpec(spec: ModelSpec): string {
  if ('provider' in spec) return spec.model;
  return (spec as Provider).modelId;
}

/**
 * Pick the highest-cost tier across the supplied per-tool hints.
 * Explicit `ModelSpec` entries are treated as the highest tier
 * (`'smart'`) for tie-breaking - the conservative-correctness rule
 * documented in DEC-169 / suggested ADR-057.
 *
 * Returns the picked hint together with the original `ModelSpec`
 * (when an explicit spec won the tie-break).
 *
 * @stable
 */
export function pickTopTierAcrossTools(
  hints: ReadonlyArray<ModelHint | ModelSpec | undefined>,
): { readonly hint: ModelHint; readonly spec?: ModelSpec } | undefined {
  let bestRank = -1;
  let bestSpec: ModelSpec | undefined;
  let bestHint: ModelHint | undefined;
  for (const h of hints) {
    if (h === undefined) continue;
    if (isModelHint(h)) {
      const rank = TIER_ORDER[h];
      if (rank > bestRank) {
        bestRank = rank;
        bestSpec = undefined;
        bestHint = h;
      }
    } else {
      // Explicit `ModelSpec` -> treat as the highest tier.
      const rank = TIER_ORDER.smart;
      if (rank >= bestRank) {
        bestRank = rank;
        bestSpec = h;
        bestHint = 'smart';
      }
    }
  }
  if (bestHint === undefined) return undefined;
  if (bestSpec !== undefined) return { hint: bestHint, spec: bestSpec };
  return { hint: bestHint };
}

/**
 * Walk the precedence ladder and return the resolved provider for a
 * single agent step. Pure function - no side effects.
 *
 * @stable
 */
export function resolvePreferredModel(input: ResolvePreferredModelInput): PreferredModelResolution {
  if (input.prepareStepProvider !== undefined) {
    return {
      resolvedProvider: input.prepareStepProvider,
      resolvedModelId: input.prepareStepProvider.modelId,
      source: 'prepare-step',
    };
  }
  const top = pickTopTierAcrossTools(input.toolPreferredModels);
  if (top !== undefined) {
    if (top.spec !== undefined) {
      return {
        resolvedProvider: specToProvider(top.spec),
        resolvedModelId: modelIdFromSpec(top.spec),
        source: 'spec',
      };
    }
    const mapped = input.modelTierMap?.[top.hint];
    if (mapped !== undefined) {
      return {
        resolvedProvider: specToProvider(mapped),
        resolvedModelId: modelIdFromSpec(mapped),
        source: 'tier-map',
        hintApplied: top.hint,
      };
    }
    // Fall through to agent-preferred / default.
    const agent = input.agentPreferredModel;
    if (agent !== undefined) {
      if (isModelHint(agent)) {
        const agentMapped = input.modelTierMap?.[agent];
        if (agentMapped !== undefined) {
          return {
            resolvedProvider: specToProvider(agentMapped),
            resolvedModelId: modelIdFromSpec(agentMapped),
            source: 'agent-preferred',
            hintApplied: agent,
            fallthroughReason: 'tier-not-mapped',
          };
        }
      } else {
        return {
          resolvedProvider: specToProvider(agent),
          resolvedModelId: modelIdFromSpec(agent),
          source: 'agent-preferred',
          fallthroughReason: 'tier-not-mapped',
        };
      }
    }
    return {
      resolvedProvider: input.agentDefaultProvider,
      resolvedModelId: input.agentDefaultProvider.modelId,
      source: 'fallthrough-default',
      hintApplied: top.hint,
      fallthroughReason: 'tier-not-mapped',
    };
  }
  // No per-tool hints. Honour `Agent.preferredModel` next.
  const agent = input.agentPreferredModel;
  if (agent !== undefined) {
    if (isModelHint(agent)) {
      const mapped = input.modelTierMap?.[agent];
      if (mapped !== undefined) {
        return {
          resolvedProvider: specToProvider(mapped),
          resolvedModelId: modelIdFromSpec(mapped),
          source: 'agent-preferred',
          hintApplied: agent,
        };
      }
      // Agent-default tier not mapped: fall through.
      return {
        resolvedProvider: input.agentDefaultProvider,
        resolvedModelId: input.agentDefaultProvider.modelId,
        source: 'fallthrough-default',
        hintApplied: agent,
        fallthroughReason: 'tier-not-mapped',
      };
    }
    return {
      resolvedProvider: specToProvider(agent),
      resolvedModelId: modelIdFromSpec(agent),
      source: 'agent-preferred',
    };
  }
  return {
    resolvedProvider: input.agentDefaultProvider,
    resolvedModelId: input.agentDefaultProvider.modelId,
    source: 'fallthrough-default',
  };
}
