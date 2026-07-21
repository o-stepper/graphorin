[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireAudioContent

# Interface: WireAudioContent

Defined in: packages/core/src/utils/binary-json.ts:70

**`Stable`**

Wire twin of [AudioContent](/api/@graphorin/core/interfaces/AudioContent.md).

## Extends

- `Omit`\&lt;[`AudioContent`](/api/@graphorin/core/interfaces/AudioContent.md), `"audio"`\&gt;

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-audio"></a> `audio` | `readonly` | [`EncodedBinary`](/api/@graphorin/core/type-aliases/EncodedBinary.md) | - | - | packages/core/src/utils/binary-json.ts:71 |
| <a id="property-causalitychain"></a> `causalityChain?` | `readonly` | readonly `string`[] | See [TextContent.causalityChain](/api/@graphorin/core/interfaces/TextContent.md#property-causalitychain). | [`AudioContent`](/api/@graphorin/core/interfaces/AudioContent.md).[`causalityChain`](/api/@graphorin/core/interfaces/AudioContent.md#property-causalitychain) | packages/core/src/types/message.ts:63 |
| <a id="property-mimetype"></a> `mimeType?` | `readonly` | `string` | - | [`AudioContent`](/api/@graphorin/core/interfaces/AudioContent.md).[`mimeType`](/api/@graphorin/core/interfaces/AudioContent.md#property-mimetype) | packages/core/src/types/message.ts:61 |
| <a id="property-type"></a> `type` | `readonly` | `"audio"` | - | [`AudioContent`](/api/@graphorin/core/interfaces/AudioContent.md).[`type`](/api/@graphorin/core/interfaces/AudioContent.md#property-type) | packages/core/src/types/message.ts:59 |
