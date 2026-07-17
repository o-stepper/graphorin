[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ChannelGatewayLike

# Interface: ChannelGatewayLike

Defined in: [packages/server/src/channels/daemon.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L39)

Structural surface of a channel gateway
(`createChannelGateway(...)` from `@graphorin/channels` satisfies
it; the server never imports that package).

## Stable

## Methods

### setActivityListener()?

```ts
optional setActivityListener(listener): void;
```

Defined in: [packages/server/src/channels/daemon.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L48)

A2 bridge seam: when present, the server registers a listener
that records scheduler activity on every accepted inbound
message (idle-trigger debounce).

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

Defined in: [packages/server/src/channels/daemon.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L40)

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<ChannelGatewayStatusLike>;
```

Defined in: [packages/server/src/channels/daemon.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L42)

#### Returns

`Promise`\&lt;[`ChannelGatewayStatusLike`](/api/@graphorin/server/interfaces/ChannelGatewayStatusLike.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/server/src/channels/daemon.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L41)

#### Returns

`Promise`\&lt;`void`\&gt;
