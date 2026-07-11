[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireAudioContent

# Interface: WireAudioContent

Defined in: [packages/core/src/utils/binary-json.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L67)

Wire twin of [AudioContent](/api/@graphorin/core/interfaces/AudioContent.md).

## Stable

## Extends

- `Omit`\&lt;[`AudioContent`](/api/@graphorin/core/interfaces/AudioContent.md), `"audio"`\&gt;

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-audio"></a> `audio` | `readonly` | [`EncodedBinary`](/api/@graphorin/core/type-aliases/EncodedBinary.md) | - | - | [packages/core/src/utils/binary-json.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L68) |
| <a id="property-causalitychain"></a> `causalityChain?` | `readonly` | readonly `string`[] | See [TextContent.causalityChain](/api/@graphorin/core/interfaces/TextContent.md#property-causalitychain). | [`AudioContent`](/api/@graphorin/core/interfaces/AudioContent.md).[`causalityChain`](/api/@graphorin/core/interfaces/AudioContent.md#property-causalitychain) | [packages/core/src/types/message.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L63) |
| <a id="property-mimetype"></a> `mimeType?` | `readonly` | `string` | - | [`AudioContent`](/api/@graphorin/core/interfaces/AudioContent.md).[`mimeType`](/api/@graphorin/core/interfaces/AudioContent.md#property-mimetype) | [packages/core/src/types/message.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L61) |
| <a id="property-type"></a> `type` | `readonly` | `"audio"` | - | [`AudioContent`](/api/@graphorin/core/interfaces/AudioContent.md).[`type`](/api/@graphorin/core/interfaces/AudioContent.md#property-type) | [packages/core/src/types/message.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L59) |
