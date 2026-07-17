[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelAttachment

# Interface: ChannelAttachment

Defined in: [packages/channels/src/spi.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L64)

A non-text part attached to an inbound message. The adapter
resolves vendor handles into either an inline body or a URL it
guarantees the application can fetch.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-data"></a> `data?` | `readonly` | `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | Inline body (small payloads). | [packages/channels/src/spi.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L68) |
| <a id="property-filename"></a> `filename?` | `readonly` | `string` | - | [packages/channels/src/spi.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L71) |
| <a id="property-kind"></a> `kind` | `readonly` | `"image"` \| `"audio"` \| `"file"` | - | [packages/channels/src/spi.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L65) |
| <a id="property-mimetype"></a> `mimeType?` | `readonly` | `string` | - | [packages/channels/src/spi.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L66) |
| <a id="property-sizebytes"></a> `sizeBytes?` | `readonly` | `number` | - | [packages/channels/src/spi.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L72) |
| <a id="property-url"></a> `url?` | `readonly` | `string` | Remote reference (large payloads); adapter-scoped semantics. | [packages/channels/src/spi.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L70) |
