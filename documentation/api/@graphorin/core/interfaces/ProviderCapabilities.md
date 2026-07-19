[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProviderCapabilities

# Interface: ProviderCapabilities

Defined in: packages/core/src/contracts/provider.ts:45

**`Stable`**

Static capability descriptor returned by `Provider.capabilities`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-contextwindow"></a> `contextWindow` | `readonly` | `number` | Total context window in tokens. | packages/core/src/contracts/provider.ts:53 |
| <a id="property-maxoutput"></a> `maxOutput` | `readonly` | `number` | Maximum output tokens. | packages/core/src/contracts/provider.ts:55 |
| <a id="property-multimodal"></a> `multimodal` | `readonly` | `boolean` | - | packages/core/src/contracts/provider.ts:49 |
| <a id="property-paralleltoolcalls"></a> `parallelToolCalls` | `readonly` | `boolean` | - | packages/core/src/contracts/provider.ts:48 |
| <a id="property-reasoning"></a> `reasoning` | `readonly` | `boolean` | - | packages/core/src/contracts/provider.ts:51 |
| <a id="property-reasoningcontract"></a> `reasoningContract?` | `readonly` | [`ReasoningContract`](/api/@graphorin/core/type-aliases/ReasoningContract.md) | How the provider treats reasoning content across consecutive `provider.stream(...)` calls. Drives the auto-detected default [ReasoningRetention](/api/@graphorin/core/type-aliases/ReasoningRetention.md) value when the caller does not pass an explicit override on the request. Adapters supplied with the framework declare this field; bespoke adapters that omit it are treated as `'optional'` (conservative `'strip'` default + WARN-once on first reasoning emission). | packages/core/src/contracts/provider.ts:66 |
| <a id="property-streaming"></a> `streaming` | `readonly` | `boolean` | - | packages/core/src/contracts/provider.ts:46 |
| <a id="property-structuredoutput"></a> `structuredOutput` | `readonly` | `boolean` | - | packages/core/src/contracts/provider.ts:50 |
| <a id="property-toolcalling"></a> `toolCalling` | `readonly` | `boolean` | - | packages/core/src/contracts/provider.ts:47 |
