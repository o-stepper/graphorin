[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProviderRequest

# Interface: ProviderRequest

Defined in: [packages/core/src/contracts/provider.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L92)

Provider-call request payload.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cachepolicy"></a> `cachePolicy?` | `readonly` | [`ProviderCachePolicy`](/api/@graphorin/core/interfaces/ProviderCachePolicy.md) | - | [packages/core/src/contracts/provider.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L102) |
| <a id="property-maxtokens"></a> `maxTokens?` | `readonly` | `number` | - | [packages/core/src/contracts/provider.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L99) |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | [packages/core/src/contracts/provider.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L93) |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`ProviderRequestMetadata`](/api/@graphorin/core/interfaces/ProviderRequestMetadata.md) | - | [packages/core/src/contracts/provider.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L110) |
| <a id="property-outputtype"></a> `outputType?` | `readonly` | [`OutputSpec`](/api/@graphorin/core/interfaces/OutputSpec.md) | - | [packages/core/src/contracts/provider.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L96) |
| <a id="property-parentspan"></a> `parentSpan?` | `readonly` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt; | C7: live parent span for the provider call. Like `signal`, this is a runtime handle (never serialized): `withTracing` parents its provider.generate/stream span under it so a run's traces form one tree instead of disconnected fragments. | [packages/core/src/contracts/provider.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L109) |
| <a id="property-provideroptions"></a> `providerOptions?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | [packages/core/src/contracts/provider.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L101) |
| <a id="property-reasoningretention"></a> `reasoningRetention?` | `readonly` | [`ReasoningRetention`](/api/@graphorin/core/type-aliases/ReasoningRetention.md) | Per-request override of the provider's auto-detected [ReasoningRetention](/api/@graphorin/core/type-aliases/ReasoningRetention.md) default. Only honoured when the provider declares `reasoningContract` of `'round-trip-required'` or `'optional'`; hidden-chain-of-thought providers (e.g. `'hidden'`) always strip and emit one WARN per process when an incompatible override is supplied. | [packages/core/src/contracts/provider.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L119) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/core/src/contracts/provider.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L100) |
| <a id="property-systemmessage"></a> `systemMessage?` | `readonly` | `string` | - | [packages/core/src/contracts/provider.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L97) |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | - | [packages/core/src/contracts/provider.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L98) |
| <a id="property-toolchoice"></a> `toolChoice?` | `readonly` | [`ToolChoice`](/api/@graphorin/core/type-aliases/ToolChoice.md) | - | [packages/core/src/contracts/provider.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L95) |
| <a id="property-tools"></a> `tools?` | `readonly` | readonly [`ToolDefinition`](/api/@graphorin/core/interfaces/ToolDefinition.md)[] | - | [packages/core/src/contracts/provider.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L94) |
