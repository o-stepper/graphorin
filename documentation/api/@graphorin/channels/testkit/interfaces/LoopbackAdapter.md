[**Graphorin API reference v0.12.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [testkit](/api/@graphorin/channels/testkit/index.md) / LoopbackAdapter

# Interface: LoopbackAdapter

Defined in: [packages/channels/src/testkit/loopback-adapter.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/loopback-adapter.ts#L38)

The in-memory loopback adapter: a full `ChannelAdapter` whose
transport is the test itself. Tests `inject()` inbound messages
and read `deliveries` for what the gateway sent back.

## Stable

## Extends

- [`ChannelAdapter`](/api/@graphorin/channels/interfaces/ChannelAdapter.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities` | `readonly` | [`ChannelCapabilities`](/api/@graphorin/channels/interfaces/ChannelCapabilities.md) | - | [`ChannelAdapter`](/api/@graphorin/channels/interfaces/ChannelAdapter.md).[`capabilities`](/api/@graphorin/channels/interfaces/ChannelAdapter.md#property-capabilities) | [packages/channels/src/spi.ts:216](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L216) |
| <a id="property-deliveries"></a> `deliveries` | `readonly` | readonly [`DeliveryPayload`](/api/@graphorin/channels/interfaces/DeliveryPayload.md)[] | Every payload delivered so far, in order (post-sanitization). | - | [packages/channels/src/testkit/loopback-adapter.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/loopback-adapter.ts#L42) |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable channel id; becomes `ChannelIdentity.channelId` on inbound. | [`ChannelAdapter`](/api/@graphorin/channels/interfaces/ChannelAdapter.md).[`id`](/api/@graphorin/channels/interfaces/ChannelAdapter.md#property-id) | [packages/channels/src/spi.ts:215](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L215) |
| <a id="property-started"></a> `started` | `readonly` | `boolean` | - | - | [packages/channels/src/testkit/loopback-adapter.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/loopback-adapter.ts#L43) |

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

#### Inherited from

[`ChannelAdapter`](/api/@graphorin/channels/interfaces/ChannelAdapter.md).[`deliver`](/api/@graphorin/channels/interfaces/ChannelAdapter.md#deliver)

***

### failNextDeliver()

```ts
failNextDeliver(): void;
```

Defined in: [packages/channels/src/testkit/loopback-adapter.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/loopback-adapter.ts#L45)

Make the next `deliver` call throw a retryable ChannelDeliveryError.

#### Returns

`void`

***

### inject()

```ts
inject(input): Promise<InboundAcceptance>;
```

Defined in: [packages/channels/src/testkit/loopback-adapter.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/testkit/loopback-adapter.ts#L40)

Push one inbound message through the gateway (must be started).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`LoopbackInboundInput`](/api/@graphorin/channels/testkit/interfaces/LoopbackInboundInput.md) |

#### Returns

`Promise`\&lt;[`InboundAcceptance`](/api/@graphorin/channels/interfaces/InboundAcceptance.md)\&gt;

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

#### Inherited from

[`ChannelAdapter`](/api/@graphorin/channels/interfaces/ChannelAdapter.md).[`start`](/api/@graphorin/channels/interfaces/ChannelAdapter.md#start)

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/channels/src/spi.ts:220](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/spi.ts#L220)

Stop receiving; idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`ChannelAdapter`](/api/@graphorin/channels/interfaces/ChannelAdapter.md).[`stop`](/api/@graphorin/channels/interfaces/ChannelAdapter.md#stop)
