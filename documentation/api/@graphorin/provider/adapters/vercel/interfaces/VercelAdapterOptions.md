[**Graphorin API reference v0.5.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/vercel](/api/@graphorin/provider/adapters/vercel/index.md) / VercelAdapterOptions

# Interface: VercelAdapterOptions

Defined in: packages/provider/src/adapters/vercel.ts:137

Options accepted by [vercelAdapter](/api/@graphorin/provider/adapters/vercel/functions/vercelAdapter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | Capability declaration. The adapter merges these on top of a conservative defaults table (`streaming: true`, `toolCalling: true`, `multimodal: true`, …); supply explicit values to narrow them. | packages/provider/src/adapters/vercel.ts:148 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Fully-qualified provider name, used for span / log labelling. Defaults to `${model.provider}-${model.modelId}`. | packages/provider/src/adapters/vercel.ts:142 |
| <a id="property-runtimeoverrides"></a> `runtimeOverrides?` | `readonly` | [`VercelRuntimeOverrides`](/api/@graphorin/provider/adapters/vercel/interfaces/VercelRuntimeOverrides.md) | Runtime override for the AI SDK functions. When unset, the adapter lazily `await import('ai')` on first call. Test suites pass a fixture-driven implementation directly. | packages/provider/src/adapters/vercel.ts:154 |
