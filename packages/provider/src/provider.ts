/**
 * `createProvider(...)` - wrap an adapter return value in the canonical
 * Graphorin `Provider` shape and apply optional sensitivity / capability
 * overrides.
 *
 * Adapters return a "raw" provider object; `createProvider(...)` gives
 * downstream code a single place to centralise:
 *
 * - per-instance `acceptsSensitivity` declarations,
 * - capability overrides (e.g. forcing `multimodal: false` for a tool
 *   that does not need it),
 * - default `reasoningRetention` resolution from the adapter's declared
 *   `reasoningContract`,
 * - and the agreed-upon `name` / `modelId` lock-in.
 *
 * @stable
 */

import type {
  Provider,
  ProviderCapabilities,
  ProviderRequest,
  ReasoningRetention,
  Sensitivity,
} from '@graphorin/core';

import { resolveReasoningRetention } from './reasoning/retention.js';
import { foldToolExamples } from './tool-examples.js';

/**
 * Options accepted by {@link createProvider}.
 *
 * @stable
 */
export interface CreateProviderOptions {
  /**
   * Sensitivity tiers this provider is allowed to receive. When
   * unset, the value is forwarded from the wrapped adapter (which is
   * itself populated from the trust class for `baseUrl`-driven
   * adapters).
   */
  readonly acceptsSensitivity?: ReadonlyArray<Sensitivity>;
  /**
   * Per-request override of the reasoning-retention default. The
   * adapter's `capabilities.reasoningContract` decides the auto-
   * detected default; this option pins a different value for every
   * request the wrapper sees.
   */
  readonly reasoningRetention?: ReasoningRetention;
  /**
   * Optional capability override. Useful for narrowing what a
   * downstream tool advertises (e.g. setting `multimodal: false`
   * when the consumer's prompt cache is text-only).
   */
  readonly capabilities?: Partial<ProviderCapabilities>;
}

/**
 * Wrap an adapter in the canonical `Provider` shape. Adapters returned
 * by the bundled factories already implement `Provider`; passing them
 * through `createProvider(...)` is the recommended entry point because
 * it keeps the construction site documented and gives downstream
 * middleware a single attachment surface.
 *
 * @example
 * ```ts
 * const provider = createProvider(vercelAdapter(model), {
 *   acceptsSensitivity: ['public', 'internal'],
 * });
 * ```
 *
 * @stable
 */
export function createProvider(adapter: Provider, options: CreateProviderOptions = {}): Provider {
  const capabilities: ProviderCapabilities = {
    ...adapter.capabilities,
    ...options.capabilities,
  };
  const acceptsSensitivity = options.acceptsSensitivity ?? adapter.acceptsSensitivity ?? undefined;

  const wrapped: Provider = {
    name: adapter.name,
    modelId: adapter.modelId,
    capabilities,
    ...(acceptsSensitivity ? { acceptsSensitivity } : {}),
    stream(req) {
      return adapter.stream(applyDefaults(req, options, capabilities));
    },
    generate(req) {
      return adapter.generate(applyDefaults(req, options, capabilities));
    },
    ...(adapter.countTokens ? { countTokens: adapter.countTokens.bind(adapter) } : {}),
  };
  return wrapped;
}

function applyDefaults(
  req: ProviderRequest,
  options: CreateProviderOptions,
  capabilities: ProviderCapabilities,
): ProviderRequest {
  let next = req;
  // A1: fold worked tool examples into the model-facing description so the model
  // actually sees them (the wire contract carries them; adapters never rendered
  // them). Deterministic ⇒ the tool spec stays prompt-cache-stable.
  if (next.tools !== undefined) {
    const foldedTools = foldToolExamples(next.tools);
    if (foldedTools !== next.tools) next = { ...next, tools: foldedTools };
  }
  const effectiveRetention = resolveReasoningRetention({
    ...(next.reasoningRetention !== undefined ? { requested: next.reasoningRetention } : {}),
    ...(options.reasoningRetention !== undefined ? { overridden: options.reasoningRetention } : {}),
    ...(capabilities.reasoningContract !== undefined
      ? { contract: capabilities.reasoningContract }
      : {}),
  });
  if (effectiveRetention !== next.reasoningRetention) {
    next = { ...next, reasoningRetention: effectiveRetention };
  }
  return next;
}
