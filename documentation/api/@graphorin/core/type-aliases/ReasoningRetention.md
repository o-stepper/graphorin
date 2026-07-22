[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ReasoningRetention

# Type Alias: ReasoningRetention

```ts
type ReasoningRetention = "strip" | "pass-through-claude" | "pass-through-all";
```

Defined in: packages/core/src/contracts/reasoning-retention.ts:23

**`Stable`**

How a provider treats reasoning content across consecutive
`provider.stream(...)` calls of the same agent + same model + same
run.

Three independent lifecycle operations exist for reasoning content
in the provider layer:

1. **Intra-loop transmission** - controlled by this enum. Default is
   auto-detected per provider:
   - Hidden chain-of-thought providers (e.g. OpenAI o1/o3, Google
     Gemini reasoning): `'strip'`.
   - Round-trip-required providers (e.g. Anthropic Claude tool-use
     with thinking blocks): `'pass-through-claude'`.
2. **Sub-agent handoff transmission** - always strips reasoning
   regardless of this setting; lives in
   `@graphorin/sessions` handoff filters.
3. **Prompt-cache key calculation** - reasoning blocks are excluded
   from cache-key hashes but included in outbound transmission.
