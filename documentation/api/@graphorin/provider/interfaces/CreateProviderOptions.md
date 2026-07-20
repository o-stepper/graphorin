[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / CreateProviderOptions

# Interface: CreateProviderOptions

Defined in: packages/provider/src/provider.ts:35

**`Stable`**

Options accepted by [createProvider](/api/@graphorin/provider/functions/createProvider.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Sensitivity tiers this provider is allowed to receive. When unset, the value is forwarded from the wrapped adapter (which is itself populated from the trust class for `baseUrl`-driven adapters). | packages/provider/src/provider.ts:42 |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | Optional capability override. Useful for narrowing what a downstream tool advertises (e.g. setting `multimodal: false` when the consumer's prompt cache is text-only). | packages/provider/src/provider.ts:55 |
| <a id="property-reasoningretention"></a> `reasoningRetention?` | `readonly` | [`ReasoningRetention`](/api/@graphorin/core/type-aliases/ReasoningRetention.md) | Per-request override of the reasoning-retention default. The adapter's `capabilities.reasoningContract` decides the auto- detected default; this option pins a different value for every request the wrapper sees. | packages/provider/src/provider.ts:49 |
