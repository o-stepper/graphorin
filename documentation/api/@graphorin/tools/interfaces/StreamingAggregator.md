[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / StreamingAggregator

# Interface: StreamingAggregator

Defined in: packages/tools/src/streaming/channel.ts:62

Aggregated chunks the executor reads after the tool returns. The
`chunks` array is the source of truth for the buffer-becomes-output
discipline; the executor passes it to `toResultEnvelope({ chunks })`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-chunkcount"></a> `chunkCount` | `readonly` | `number` | packages/tools/src/streaming/channel.ts:64 |
| <a id="property-chunks"></a> `chunks` | `readonly` | readonly [`ContentChunk`](/api/@graphorin/core/type-aliases/ContentChunk.md)[] | packages/tools/src/streaming/channel.ts:63 |
| <a id="property-progresseventcount"></a> `progressEventCount` | `readonly` | `number` | packages/tools/src/streaming/channel.ts:65 |
| <a id="property-totalbytes"></a> `totalBytes` | `readonly` | `number` | packages/tools/src/streaming/channel.ts:66 |
