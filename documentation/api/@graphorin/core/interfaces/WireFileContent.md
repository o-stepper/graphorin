[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireFileContent

# Interface: WireFileContent

Defined in: [packages/core/src/utils/binary-json.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L72)

Wire twin of [FileContent](/api/@graphorin/core/interfaces/FileContent.md).

## Stable

## Extends

- `Omit`\&lt;[`FileContent`](/api/@graphorin/core/interfaces/FileContent.md), `"file"`\&gt;

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-causalitychain"></a> `causalityChain?` | `readonly` | readonly `string`[] | See [TextContent.causalityChain](/api/@graphorin/core/interfaces/TextContent.md#property-causalitychain). | [`FileContent`](/api/@graphorin/core/interfaces/FileContent.md).[`causalityChain`](/api/@graphorin/core/interfaces/FileContent.md#property-causalitychain) | [packages/core/src/types/message.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L78) |
| <a id="property-file"></a> `file` | `readonly` | [`EncodedBinary`](/api/@graphorin/core/type-aliases/EncodedBinary.md) | - | - | [packages/core/src/utils/binary-json.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L73) |
| <a id="property-filename"></a> `filename?` | `readonly` | `string` | - | [`FileContent`](/api/@graphorin/core/interfaces/FileContent.md).[`filename`](/api/@graphorin/core/interfaces/FileContent.md#property-filename) | [packages/core/src/types/message.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L76) |
| <a id="property-mimetype"></a> `mimeType` | `readonly` | `string` | - | [`FileContent`](/api/@graphorin/core/interfaces/FileContent.md).[`mimeType`](/api/@graphorin/core/interfaces/FileContent.md#property-mimetype) | [packages/core/src/types/message.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L75) |
| <a id="property-type"></a> `type` | `readonly` | `"file"` | - | [`FileContent`](/api/@graphorin/core/interfaces/FileContent.md).[`type`](/api/@graphorin/core/interfaces/FileContent.md#property-type) | [packages/core/src/types/message.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L73) |
