/**
 * How a provider treats reasoning content across consecutive
 * `provider.stream(...)` calls of the same agent + same model + same
 * run.
 *
 * Three independent lifecycle operations exist for reasoning content
 * in the provider layer:
 *
 * 1. **Intra-loop transmission** - controlled by this enum. Default is
 *    auto-detected per provider:
 *    - Hidden chain-of-thought providers (e.g. OpenAI o1/o3, Google
 *      Gemini reasoning): `'strip'`.
 *    - Round-trip-required providers (e.g. Anthropic Claude tool-use
 *      with thinking blocks): `'pass-through-claude'`.
 * 2. **Sub-agent handoff transmission** - always strips reasoning
 *    regardless of this setting; lives in
 *    `@graphorin/sessions` handoff filters.
 * 3. **Prompt-cache key calculation** - reasoning blocks are excluded
 *    from cache-key hashes but included in outbound transmission.
 *
 * @stable
 */
export type ReasoningRetention =
  /**
   * Drop reasoning content from the next request body. Default for
   * hidden-chain-of-thought providers and the conservative default
   * for unknown providers.
   */
  | 'strip'
  /**
   * Round-trip Anthropic-shaped thinking blocks
   * (`signature` / `data` / `text` fields) byte-equal to the previous
   * assistant message.
   */
  | 'pass-through-claude'
  /**
   * Round-trip every reasoning content part the provider returns
   * regardless of vendor shape. Useful for custom providers that
   * declare `reasoningContract: 'optional'` and still benefit from
   * preserving the chain.
   */
  | 'pass-through-all';

/**
 * Capability declaration on `ProviderCapabilities` describing how the
 * provider treats reasoning content. The field is auto-populated per
 * provider family by the adapter; consumers use it to infer the
 * default {@link ReasoningRetention} value for a request.
 *
 * @stable
 */
export type ReasoningContract = 'hidden' | 'round-trip-required' | 'optional';
