[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / StreamingChannel

# Interface: StreamingChannel

Defined in: packages/tools/src/streaming/channel.ts:107

**`Stable`**

Public channel surface. Implementations are returned by
[createStreamingChannel](/api/@graphorin/tools/functions/createStreamingChannel.md).

## Methods

### abort()

```ts
abort(reason): void;
```

Defined in: packages/tools/src/streaming/channel.ts:113

Mark the channel cancelled (post-cancellation calls are no-ops).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason` | `"cancelled"` \| `"finished"` |

#### Returns

`void`

***

### reportProgress()

```ts
reportProgress(
   current, 
   total?, 
   message?): void;
```

Defined in: packages/tools/src/streaming/channel.ts:109

Emit a progress event into the channel.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `current` | `number` |
| `total?` | `number` |
| `message?` | `string` |

#### Returns

`void`

***

### snapshot()

```ts
snapshot(): StreamingAggregator;
```

Defined in: packages/tools/src/streaming/channel.ts:115

Snapshot the aggregated buffer.

#### Returns

[`StreamingAggregator`](/api/@graphorin/tools/interfaces/StreamingAggregator.md)

***

### streamContent()

```ts
streamContent(chunk): void;
```

Defined in: packages/tools/src/streaming/channel.ts:111

Emit a content chunk into the channel.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `chunk` | [`ContentChunk`](/api/@graphorin/core/type-aliases/ContentChunk.md) |

#### Returns

`void`
