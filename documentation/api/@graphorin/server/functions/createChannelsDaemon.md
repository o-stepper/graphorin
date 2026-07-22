[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createChannelsDaemon

# Function: createChannelsDaemon()

```ts
function createChannelsDaemon(options): ChannelsDaemon;
```

Defined in: packages/server/src/channels/daemon.ts:75

**`Stable`**

Wrap a channel gateway in the managed-daemon surface the lifecycle
drives (idempotent start/stop, bounded stop).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateChannelsDaemonOptions`](/api/@graphorin/server/interfaces/CreateChannelsDaemonOptions.md) |

## Returns

[`ChannelsDaemon`](/api/@graphorin/server/interfaces/ChannelsDaemon.md)
