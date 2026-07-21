[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / StreamingChannelOptions

# Interface: StreamingChannelOptions

Defined in: packages/tools/src/streaming/channel.ts:39

Configuration for [createStreamingChannel](/api/@graphorin/tools/functions/createStreamingChannel.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-eventqueuedepth"></a> `eventQueueDepth?` | `readonly` | `number` | Re-entrancy guard depth for the SYNCHRONOUS sink delivery. Delivery is not a queue: each event is handed to the sink inline and `inFlight` only exceeds 1 when the sink itself re-enters the channel - in which case the CURRENT (newest) event is dropped and counted. Default `256`. | packages/tools/src/streaming/channel.ts:50 |
| <a id="property-maxbufferbytes"></a> `maxBufferBytes?` | `readonly` | `number` | Byte cap on the in-memory aggregation buffer (the buffer-becomes-output `chunks`). Past the cap, chunks still DELIVER to the sink (subscribers keep streaming) but stop accumulating, the dropped bytes are counted (`tool.streaming.buffer.dropped-bytes.total`) and [StreamingAggregator.bufferTruncated](/api/@graphorin/tools/interfaces/StreamingAggregator.md#property-buffertruncated) flips so the envelope / spill path can mark the assembled body incomplete. Default 8 MiB. | packages/tools/src/streaming/channel.ts:60 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Wall clock for tests. Defaults to `Date.now`. | packages/tools/src/streaming/channel.ts:77 |
| <a id="property-sink"></a> `sink?` | `readonly` | (`event`) => `void` | Optional sink invoked for every streaming event. The agent runtime injects a sink that re-emits into `agent.stream(...)`. Tests pass a fixture sink to assert event ordering. | packages/tools/src/streaming/channel.ts:75 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | packages/tools/src/streaming/channel.ts:42 |
| <a id="property-streaminghint"></a> `streamingHint?` | `readonly` | `boolean` | Optional streaming-hint flag. When `false` the channel turns `report` / `content` into no-ops; the executor still reads the empty assembled buffer at the end so the buffer-becomes-output discipline degrades gracefully. **Default** `true` | packages/tools/src/streaming/channel.ts:69 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/tools/src/streaming/channel.ts:41 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/tools/src/streaming/channel.ts:40 |
