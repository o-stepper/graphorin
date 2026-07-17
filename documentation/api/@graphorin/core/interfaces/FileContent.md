[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / FileContent

# Interface: FileContent

Defined in: [packages/core/src/types/message.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L72)

Generic file attachment (PDF, CSV, …). `mimeType` is mandatory because
many providers gate file ingestion on it.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-causalitychain"></a> `causalityChain?` | `readonly` | readonly `string`[] | See [TextContent.causalityChain](/api/@graphorin/core/interfaces/TextContent.md#property-causalitychain). | [packages/core/src/types/message.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L78) |
| <a id="property-file"></a> `file` | `readonly` | `Uint8Array`\&lt;`ArrayBufferLike`\&gt; \| `URL` | - | [packages/core/src/types/message.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L74) |
| <a id="property-filename"></a> `filename?` | `readonly` | `string` | - | [packages/core/src/types/message.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L76) |
| <a id="property-mimetype"></a> `mimeType` | `readonly` | `string` | - | [packages/core/src/types/message.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L75) |
| <a id="property-type"></a> `type` | `readonly` | `"file"` | - | [packages/core/src/types/message.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L73) |
