[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelAdapter

# Interface: ChannelAdapter

Defined in: [packages/channels/src/spi.ts:213](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L213)

The adapter contract. One instance per channel account; the
gateway drives the lifecycle (`start` on gateway start, `stop` on
gateway stop) and calls `deliver` for outbound traffic.

Implementations live in application repositories and are validated
against the conformance suite in `@graphorin/channels/testkit`.

## Stable

## Extended by

- [`LoopbackAdapter`](/api/@graphorin/channels/testkit/interfaces/LoopbackAdapter.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities` | `readonly` | [`ChannelCapabilities`](/api/@graphorin/channels/interfaces/ChannelCapabilities.md) | - | [packages/channels/src/spi.ts:216](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L216) |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable channel id; becomes `ChannelIdentity.channelId` on inbound. | [packages/channels/src/spi.ts:215](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L215) |

## Methods

### deliver()

```ts
deliver(payload): Promise<DeliveryReceipt>;
```

Defined in: [packages/channels/src/spi.ts:225](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L225)

Deliver one outbound payload. Throws [ChannelDeliveryError](/api/@graphorin/channels/classes/ChannelDeliveryError.md)
after in-call retries are exhausted (D-14: no durable outbox).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | [`DeliveryPayload`](/api/@graphorin/channels/interfaces/DeliveryPayload.md) |

#### Returns

`Promise`\&lt;[`DeliveryReceipt`](/api/@graphorin/channels/interfaces/DeliveryReceipt.md)\&gt;

***

### start()

```ts
start(ctx): Promise<void>;
```

Defined in: [packages/channels/src/spi.ts:218](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L218)

Subscribe / start polling. Resolves once the adapter is receiving.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`ChannelRuntimeContext`](/api/@graphorin/channels/interfaces/ChannelRuntimeContext.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/channels/src/spi.ts:220](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L220)

Stop receiving; idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;
