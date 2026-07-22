[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelUnauthorizedHandler

# Type Alias: ChannelUnauthorizedHandler

```ts
type ChannelUnauthorizedHandler = (message, decision, io) => Promise<void>;
```

Defined in: packages/channels/src/gateway.ts:80

**`Stable`**

Callback for denied / unpaired peers. The FRAMEWORK never texts a
peer on its own - the challenge/denial wording is application
policy; use `io.deliver` to render one.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | [`InboundChannelMessage`](/api/@graphorin/channels/interfaces/InboundChannelMessage.md) |
| `decision` | `Exclude`\&lt;[`ChannelAccessDecision`](/api/@graphorin/channels/type-aliases/ChannelAccessDecision.md), \{ `kind`: `"allow"`; \}\&gt; |
| `io` | \{ `deliver`: (`reply`) => `Promise`\&lt;[`DeliveryReceipt`](/api/@graphorin/channels/interfaces/DeliveryReceipt.md)\&gt;; \} |
| `io.deliver` | (`reply`) => `Promise`\&lt;[`DeliveryReceipt`](/api/@graphorin/channels/interfaces/DeliveryReceipt.md)\&gt; |

## Returns

`Promise`\&lt;`void`\&gt;
