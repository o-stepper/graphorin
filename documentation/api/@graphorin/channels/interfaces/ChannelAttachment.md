[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelAttachment

# Interface: ChannelAttachment

Defined in: packages/channels/src/spi.ts:64

**`Stable`**

A non-text part attached to an inbound message. The adapter
resolves vendor handles into either an inline body or a URL it
guarantees the application can fetch.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-data"></a> `data?` | `readonly` | `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | Inline body (small payloads). | packages/channels/src/spi.ts:68 |
| <a id="property-filename"></a> `filename?` | `readonly` | `string` | - | packages/channels/src/spi.ts:71 |
| <a id="property-kind"></a> `kind` | `readonly` | `"image"` \| `"audio"` \| `"file"` | - | packages/channels/src/spi.ts:65 |
| <a id="property-mimetype"></a> `mimeType?` | `readonly` | `string` | - | packages/channels/src/spi.ts:66 |
| <a id="property-sizebytes"></a> `sizeBytes?` | `readonly` | `number` | - | packages/channels/src/spi.ts:72 |
| <a id="property-url"></a> `url?` | `readonly` | `string` | Remote reference (large payloads); adapter-scoped semantics. | packages/channels/src/spi.ts:70 |
