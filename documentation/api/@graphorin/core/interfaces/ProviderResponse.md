[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProviderResponse

# Interface: ProviderResponse

Defined in: [packages/core/src/contracts/provider.ts:140](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L140)

One-shot response shape returned by `Provider.generate(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-finishreason"></a> `finishReason` | `readonly` | [`FinishReason`](/api/@graphorin/core/type-aliases/FinishReason.md) | - | [packages/core/src/contracts/provider.ts:149](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L149) |
| <a id="property-providermetadata"></a> `providerMetadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | [packages/core/src/contracts/provider.ts:150](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L150) |
| <a id="property-text"></a> `text?` | `readonly` | `string` | - | [packages/core/src/contracts/provider.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L141) |
| <a id="property-toolcalls"></a> `toolCalls?` | `readonly` | readonly [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md)[] | Tool invocations the model requested. W-127: reuses the canonical [ToolCall](/api/@graphorin/core/interfaces/ToolCall.md) (the inline shape here was structurally identical and only invited drift). | [packages/core/src/contracts/provider.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L147) |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | - | [packages/core/src/contracts/provider.ts:148](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L148) |
