[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ImageContent

# Interface: ImageContent

Defined in: [packages/core/src/types/message.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L44)

Image attachment. The `image` field accepts either raw bytes or a `URL`
- adapters dereference the URL when the provider only accepts inline
payloads.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-causalitychain"></a> `causalityChain?` | `readonly` | readonly `string`[] | See [TextContent.causalityChain](/api/@graphorin/core/interfaces/TextContent.md#property-causalitychain). | [packages/core/src/types/message.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L49) |
| <a id="property-image"></a> `image` | `readonly` | `Uint8Array`\&lt;`ArrayBufferLike`\&gt; \| `URL` | - | [packages/core/src/types/message.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L46) |
| <a id="property-mimetype"></a> `mimeType?` | `readonly` | `string` | - | [packages/core/src/types/message.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L47) |
| <a id="property-type"></a> `type` | `readonly` | `"image"` | - | [packages/core/src/types/message.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L45) |
