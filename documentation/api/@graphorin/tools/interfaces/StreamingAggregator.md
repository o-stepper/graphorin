[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / StreamingAggregator

# Interface: StreamingAggregator

Defined in: packages/tools/src/streaming/channel.ts:87

**`Stable`**

Aggregated chunks the executor reads after the tool returns. The
`chunks` array is the source of truth for the buffer-becomes-output
discipline; the executor passes it to `toResultEnvelope({ chunks })`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-buffertruncated"></a> `bufferTruncated` | `readonly` | `boolean` | W-117: `true` when the aggregation buffer hit `maxBufferBytes` and later chunks were dropped from the ASSEMBLED body (sink delivery continued). Consumers building an output / spill artifact from `chunks` must treat the body as incomplete. | packages/tools/src/streaming/channel.ts:98 |
| <a id="property-chunkcount"></a> `chunkCount` | `readonly` | `number` | - | packages/tools/src/streaming/channel.ts:89 |
| <a id="property-chunks"></a> `chunks` | `readonly` | readonly [`ContentChunk`](/api/@graphorin/core/type-aliases/ContentChunk.md)[] | - | packages/tools/src/streaming/channel.ts:88 |
| <a id="property-progresseventcount"></a> `progressEventCount` | `readonly` | `number` | - | packages/tools/src/streaming/channel.ts:90 |
| <a id="property-totalbytes"></a> `totalBytes` | `readonly` | `number` | - | packages/tools/src/streaming/channel.ts:91 |
