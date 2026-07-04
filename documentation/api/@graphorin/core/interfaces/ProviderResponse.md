[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProviderResponse

# Interface: ProviderResponse

Defined in: packages/core/src/contracts/provider.ts:139

One-shot response shape returned by `Provider.generate(...)`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-finishreason"></a> `finishReason` | `readonly` | [`FinishReason`](/api/@graphorin/core/type-aliases/FinishReason.md) | packages/core/src/contracts/provider.ts:147 |
| <a id="property-providermetadata"></a> `providerMetadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/core/src/contracts/provider.ts:148 |
| <a id="property-text"></a> `text?` | `readonly` | `string` | packages/core/src/contracts/provider.ts:140 |
| <a id="property-toolcalls"></a> `toolCalls?` | `readonly` | readonly \{ `args`: `unknown`; `toolCallId`: `string`; `toolName`: `string`; \}[] | packages/core/src/contracts/provider.ts:141 |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | packages/core/src/contracts/provider.ts:146 |
