[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelRuntimeContext

# Interface: ChannelRuntimeContext

Defined in: [packages/channels/src/spi.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L127)

Runtime context handed to [ChannelAdapter.start](/api/@graphorin/channels/interfaces/ChannelAdapter.md#start). The adapter
pushes normalized inbound messages through `onInbound` and observes
`signal` for shutdown.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-signal"></a> `signal` | `readonly` | `AbortSignal` | Aborted when the gateway stops; adapters should cease polling/subscriptions. | [packages/channels/src/spi.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L135) |

## Methods

### onInbound()

```ts
onInbound(message): Promise<InboundAcceptance>;
```

Defined in: [packages/channels/src/spi.ts:133](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L133)

Enqueue a normalized inbound message. Resolves once the message
is accepted into (or shed from) the gateway's bounded queue -
NOT once it has been processed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | [`InboundChannelMessage`](/api/@graphorin/channels/interfaces/InboundChannelMessage.md) |

#### Returns

`Promise`\&lt;[`InboundAcceptance`](/api/@graphorin/channels/interfaces/InboundAcceptance.md)\&gt;
