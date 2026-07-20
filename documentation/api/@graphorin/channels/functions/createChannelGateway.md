[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / createChannelGateway

# Function: createChannelGateway()

```ts
function createChannelGateway(options): ChannelGateway;
```

Defined in: packages/channels/src/gateway.ts:176

**`Stable`**

Build the gateway. Throws [ChannelGatewayConfigError](/api/@graphorin/channels/classes/ChannelGatewayConfigError.md) on an
empty adapter list or duplicate adapter ids - fail-closed at
construction.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ChannelGatewayOptions`](/api/@graphorin/channels/interfaces/ChannelGatewayOptions.md) |

## Returns

[`ChannelGateway`](/api/@graphorin/channels/interfaces/ChannelGateway.md)
