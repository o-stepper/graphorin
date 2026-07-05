[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProviderCachePolicy

# Interface: ProviderCachePolicy

Defined in: packages/core/src/contracts/provider.ts:81

Opt-in prompt-cache breakpoint policy (core-provider-02).

`breakpoints: 'auto'` asks the adapter to place provider-native cache
anchors around the stable request prefix: the Anthropic path (via the
vercel adapter) marks the first and last conversation messages with
`cache_control: { type: 'ephemeral' }` so tools + system + the stable
prefix are written once and read at ~0.1x input price on subsequent
steps. Providers with automatic caching (OpenAI) or no cache concept
ignore the policy. `ttl` maps to Anthropic's extended cache TTL.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-breakpoints"></a> `breakpoints` | `readonly` | `"auto"` \| `"none"` | packages/core/src/contracts/provider.ts:82 |
| <a id="property-ttl"></a> `ttl?` | `readonly` | `"5m"` \| `"1h"` | packages/core/src/contracts/provider.ts:83 |
