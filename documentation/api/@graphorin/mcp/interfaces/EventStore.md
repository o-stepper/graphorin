[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / EventStore

# Interface: EventStore

Defined in: packages/mcp/src/event-store/types.ts:60

Persistence contract for resumable streaming sessions.

Implementations MUST:

- Assign a monotonically-increasing [EventId](/api/@graphorin/mcp/type-aliases/EventId.md) per
  `(streamId)` namespace at `storeEvent(...)` time.
- Replay every event whose id is greater than `lastEventId`, in
  storage order, when [replayEventsAfter](/api/@graphorin/mcp/interfaces/EventStore.md#replayeventsafter) is invoked.
- Return the [StreamId](/api/@graphorin/mcp/type-aliases/StreamId.md) the replayed events belong to so the
  caller can correlate the replay with the originating stream.

Implementations MAY enforce a per-stream capacity (the default
in-memory store keeps a fixed-size ring buffer); evicted events
are unrecoverable and the next resume falls through to the
configured `resumeMode`.

## Stable

## Methods

### clearStream()

```ts
clearStream(streamId): Promise<void>;
```

Defined in: packages/mcp/src/event-store/types.ts:64

Drop every entry for the supplied stream.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `streamId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### replayEventsAfter()

```ts
replayEventsAfter(lastEventId, opts): Promise<string>;
```

Defined in: packages/mcp/src/event-store/types.ts:62

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lastEventId` | `string` |
| `opts` | [`ReplayEventsAfterOptions`](/api/@graphorin/mcp/interfaces/ReplayEventsAfterOptions.md) |

#### Returns

`Promise`\&lt;`string`\&gt;

***

### size()

```ts
size(): Promise<number>;
```

Defined in: packages/mcp/src/event-store/types.ts:66

Snapshot helper for tests and the operator dashboard.

#### Returns

`Promise`\&lt;`number`\&gt;

***

### storeEvent()

```ts
storeEvent(streamId, message): Promise<string>;
```

Defined in: packages/mcp/src/event-store/types.ts:61

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `streamId` | `string` |
| `message` | [`JsonRpcMessage`](/api/@graphorin/mcp/type-aliases/JsonRpcMessage.md) |

#### Returns

`Promise`\&lt;`string`\&gt;
