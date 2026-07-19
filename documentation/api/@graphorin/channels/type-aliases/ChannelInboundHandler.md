[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelInboundHandler

# Type Alias: ChannelInboundHandler

```ts
type ChannelInboundHandler = (context) => Promise<
  | ChannelReply
| undefined>;
```

Defined in: packages/channels/src/gateway.ts:69

**`Stable`**

The application seam: invoked once per authorized inbound message,
typically running an agent for `route.agentId` /
`route.sessionKey`. A returned reply is delivered to the peer;
return `undefined` to stay silent. Errors are contained (counted +
warned), never fatal to the gateway.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`ChannelInboundContext`](/api/@graphorin/channels/interfaces/ChannelInboundContext.md) |

## Returns

`Promise`\<
  \| [`ChannelReply`](/api/@graphorin/channels/interfaces/ChannelReply.md)
  \| `undefined`\>
