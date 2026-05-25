[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / ReplayEventsAfterOptions

# Interface: ReplayEventsAfterOptions

Defined in: packages/mcp/src/event-store/types.ts:32

Options accepted by [EventStore.replayEventsAfter](/api/@graphorin/mcp/interfaces/EventStore.md#replayeventsafter).

## Stable

## Methods

### send()

```ts
send(eventId, message): Promise<void>;
```

Defined in: packages/mcp/src/event-store/types.ts:38

Callback invoked once per replayed event, in storage order. The
implementation must await the callback so the consumer can
back-pressure replay if needed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `eventId` | `string` |
| `message` | [`JsonRpcMessage`](/api/@graphorin/mcp/type-aliases/JsonRpcMessage.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
