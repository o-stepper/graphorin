[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelGateway

# Interface: ChannelGateway

Defined in: [packages/channels/src/gateway.ts:137](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L137)

The gateway handle. `setActivityListener` is the A2 bridge seam:
the server (or any host) registers a callback fired on every
ACCEPTED inbound message, and wires it to
`Scheduler.recordActivity()` so idle triggers debounce on channel
traffic. Single listener slot.

## Stable

## Methods

### deliver()

```ts
deliver(payload): Promise<DeliveryReceipt>;
```

Defined in: [packages/channels/src/gateway.ts:142](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L142)

Proactive outbound send (outbound-sanitized like replies).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | [`DeliveryPayload`](/api/@graphorin/channels/interfaces/DeliveryPayload.md) |

#### Returns

`Promise`\&lt;[`DeliveryReceipt`](/api/@graphorin/channels/interfaces/DeliveryReceipt.md)\&gt;

***

### setActivityListener()

```ts
setActivityListener(listener): void;
```

Defined in: [packages/channels/src/gateway.ts:143](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L143)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | (() => `void`) \| `undefined` |

#### Returns

`void`

***

### start()

```ts
start(): Promise<void>;
```

Defined in: [packages/channels/src/gateway.ts:138](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L138)

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<ChannelGatewayStatus>;
```

Defined in: [packages/channels/src/gateway.ts:140](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L140)

#### Returns

`Promise`\&lt;[`ChannelGatewayStatus`](/api/@graphorin/channels/interfaces/ChannelGatewayStatus.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/channels/src/gateway.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/gateway.ts#L139)

#### Returns

`Promise`\&lt;`void`\&gt;
