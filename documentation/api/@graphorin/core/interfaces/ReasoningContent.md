[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ReasoningContent

# Interface: ReasoningContent

Defined in: [packages/core/src/types/message.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L89)

Reasoning content emitted by reasoning-capable models. Stored
separately from `text` so that consumers can choose to hide / strip
it (per the streaming-first principle and the replay-redaction
policy).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-causalitychain"></a> `causalityChain?` | `readonly` | readonly `string`[] | See [TextContent.causalityChain](/api/@graphorin/core/interfaces/TextContent.md#property-causalitychain). | [packages/core/src/types/message.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L106) |
| <a id="property-meta"></a> `meta?` | `readonly` | [`ReasoningContentMeta`](/api/@graphorin/core/interfaces/ReasoningContentMeta.md) | Provider-specific opaque metadata that MUST round-trip byte-equal when the effective `reasoningRetention` is not `'strip'`. The field is provider-supplied protocol payload, not user content, and is therefore exempt from prompt-redaction scanning. Anthropic Claude tool-use thinking blocks supply `{ provider: 'anthropic', signature, data? }`; other providers are free to populate whatever opaque keys their wire contract requires. Adapters that do not need round-tripping omit this field entirely. | [packages/core/src/types/message.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L104) |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | [packages/core/src/types/message.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L91) |
| <a id="property-type"></a> `type` | `readonly` | `"reasoning"` | - | [packages/core/src/types/message.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L90) |
