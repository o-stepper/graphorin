[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireImageContent

# Interface: WireImageContent

Defined in: packages/core/src/utils/binary-json.ts:65

**`Stable`**

Wire twin of [ImageContent](/api/@graphorin/core/interfaces/ImageContent.md).

## Extends

- `Omit`\&lt;[`ImageContent`](/api/@graphorin/core/interfaces/ImageContent.md), `"image"`\&gt;

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-causalitychain"></a> `causalityChain?` | `readonly` | readonly `string`[] | See [TextContent.causalityChain](/api/@graphorin/core/interfaces/TextContent.md#property-causalitychain). | [`ImageContent`](/api/@graphorin/core/interfaces/ImageContent.md).[`causalityChain`](/api/@graphorin/core/interfaces/ImageContent.md#property-causalitychain) | packages/core/src/types/message.ts:49 |
| <a id="property-image"></a> `image` | `readonly` | [`EncodedBinary`](/api/@graphorin/core/type-aliases/EncodedBinary.md) | - | - | packages/core/src/utils/binary-json.ts:66 |
| <a id="property-mimetype"></a> `mimeType?` | `readonly` | `string` | - | [`ImageContent`](/api/@graphorin/core/interfaces/ImageContent.md).[`mimeType`](/api/@graphorin/core/interfaces/ImageContent.md#property-mimetype) | packages/core/src/types/message.ts:47 |
| <a id="property-type"></a> `type` | `readonly` | `"image"` | - | [`ImageContent`](/api/@graphorin/core/interfaces/ImageContent.md).[`type`](/api/@graphorin/core/interfaces/ImageContent.md#property-type) | packages/core/src/types/message.ts:45 |
