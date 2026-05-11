[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProviderRequest

# Interface: ProviderRequest

Defined in: packages/core/src/contracts/provider.ts:73

Provider-call request payload.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxtokens"></a> `maxTokens?` | `readonly` | `number` | - | packages/core/src/contracts/provider.ts:80 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | packages/core/src/contracts/provider.ts:74 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`ProviderRequestMetadata`](/api/@graphorin/core/interfaces/ProviderRequestMetadata.md) | - | packages/core/src/contracts/provider.ts:83 |
| <a id="property-outputtype"></a> `outputType?` | `readonly` | [`OutputSpec`](/api/@graphorin/core/interfaces/OutputSpec.md) | - | packages/core/src/contracts/provider.ts:77 |
| <a id="property-provideroptions"></a> `providerOptions?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | packages/core/src/contracts/provider.ts:82 |
| <a id="property-reasoningretention"></a> `reasoningRetention?` | `readonly` | [`ReasoningRetention`](/api/@graphorin/core/type-aliases/ReasoningRetention.md) | Per-request override of the provider's auto-detected [ReasoningRetention](/api/@graphorin/core/type-aliases/ReasoningRetention.md) default. Only honoured when the provider declares `reasoningContract` of `'round-trip-required'` or `'optional'`; hidden-chain-of-thought providers (e.g. `'hidden'`) always strip and emit one WARN per process when an incompatible override is supplied. | packages/core/src/contracts/provider.ts:92 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/core/src/contracts/provider.ts:81 |
| <a id="property-systemmessage"></a> `systemMessage?` | `readonly` | `string` | - | packages/core/src/contracts/provider.ts:78 |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | - | packages/core/src/contracts/provider.ts:79 |
| <a id="property-toolchoice"></a> `toolChoice?` | `readonly` | [`ToolChoice`](/api/@graphorin/core/type-aliases/ToolChoice.md) | - | packages/core/src/contracts/provider.ts:76 |
| <a id="property-tools"></a> `tools?` | `readonly` | readonly [`ToolDefinition`](/api/@graphorin/core/interfaces/ToolDefinition.md)[] | - | packages/core/src/contracts/provider.ts:75 |
