[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / InMemoryEventStore

# Class: InMemoryEventStore

Defined in: packages/mcp/src/event-store/in-memory.ts:44

Default [EventStore](/api/@graphorin/mcp/interfaces/EventStore.md) implementation. Keeps a per-stream
fixed-size ring buffer of recent events.

## Stable

## Implements

- [`EventStore`](/api/@graphorin/mcp/interfaces/EventStore.md)

## Constructors

### Constructor

```ts
new InMemoryEventStore(opts?): InMemoryEventStore;
```

Defined in: packages/mcp/src/event-store/in-memory.ts:50

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | `InMemoryEventStoreOptions` |

#### Returns

`InMemoryEventStore`

## Methods

### clearStream()

```ts
clearStream(streamId): Promise<void>;
```

Defined in: packages/mcp/src/event-store/in-memory.ts:99

Drop every entry for the supplied stream.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `streamId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`EventStore`](/api/@graphorin/mcp/interfaces/EventStore.md).[`clearStream`](/api/@graphorin/mcp/interfaces/EventStore.md#clearstream)

***

### eviction()

```ts
eviction(streamId): number;
```

Defined in: packages/mcp/src/event-store/in-memory.ts:59

Per-stream eviction counter snapshot for tests + metrics.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `streamId` | `string` |

#### Returns

`number`

***

### replayEventsAfter()

```ts
replayEventsAfter(lastEventId, opts): Promise<string>;
```

Defined in: packages/mcp/src/event-store/in-memory.ts:78

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lastEventId` | `string` |
| `opts` | [`ReplayEventsAfterOptions`](/api/@graphorin/mcp/interfaces/ReplayEventsAfterOptions.md) |

#### Returns

`Promise`\&lt;`string`\&gt;

#### Implementation of

[`EventStore`](/api/@graphorin/mcp/interfaces/EventStore.md).[`replayEventsAfter`](/api/@graphorin/mcp/interfaces/EventStore.md#replayeventsafter)

***

### size()

```ts
size(): Promise<number>;
```

Defined in: packages/mcp/src/event-store/in-memory.ts:104

Snapshot helper for tests and the operator dashboard.

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`EventStore`](/api/@graphorin/mcp/interfaces/EventStore.md).[`size`](/api/@graphorin/mcp/interfaces/EventStore.md#size)

***

### storeEvent()

```ts
storeEvent(streamId, message): Promise<string>;
```

Defined in: packages/mcp/src/event-store/in-memory.ts:63

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `streamId` | `string` |
| `message` | [`JsonRpcMessage`](/api/@graphorin/mcp/type-aliases/JsonRpcMessage.md) |

#### Returns

`Promise`\&lt;`string`\&gt;

#### Implementation of

[`EventStore`](/api/@graphorin/mcp/interfaces/EventStore.md).[`storeEvent`](/api/@graphorin/mcp/interfaces/EventStore.md#storeevent)
