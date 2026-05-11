/**
 * Cost-tier vocabulary for declaring a preferred model on a tool or
 * agent. Provider-agnostic at the tool-author level; the operator-side
 * `Agent.modelTierMap?: Partial<Record<ModelHint, ModelSpec>>` mapping
 * resolves the hint to a concrete provider per agent.
 *
 * The three tiers describe canonical cloud-provider price-quality
 * envelopes circa 2026:
 *
 * - `'fast'`     — low-cost / low-latency / file-navigation /
 *   parameter-extraction / low-stakes calls.
 * - `'balanced'` — median cost-quality; the default tier for most
 *   tools.
 * - `'smart'`    — high-quality / high-stakes / reasoning-heavy /
 *   summarization / code-review calls.
 *
 * The vocabulary is Graphorin's own design — no third-party routing-
 * guide attribution leaks into the public surface. Per-provider
 * dispatch lives in `@graphorin/provider/model-tier/classify.ts`.
 *
 * @stable
 */
export type ModelHint = 'fast' | 'balanced' | 'smart';

/**
 * Discriminated string-literal triple for type-level work.
 *
 * @stable
 */
export const MODEL_HINTS: readonly ModelHint[] = ['fast', 'balanced', 'smart'] as const;

/**
 * Forward-declared shape of `Provider`. Re-declared here as a minimal
 * structural type so this module stays cycle-free with respect to
 * `./provider.ts` and downstream consumers can use `ModelSpec` without
 * importing the heavier `Provider` interface.
 *
 * @internal
 */
export interface ProviderLike {
  readonly name: string;
  readonly modelId: string;
}

/**
 * Concrete provider declaration used at site of the per-tool hint
 * override (Phase 07), the per-tier mapping
 * (`Agent.modelTierMap`, Phase 12), and the agent-level fallback chain
 * (`Agent.fallbackModels`, Phase 12).
 *
 * The shape is unified deliberately so operators learn one thing and
 * use it three places.
 *
 * @stable
 */
export type ModelSpec = ProviderLike | { readonly provider: ProviderLike; readonly model: string };
