[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ChannelsDaemon

# Interface: ChannelsDaemon

Defined in: [packages/server/src/channels/daemon.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L62)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-gateway"></a> `gateway` | `readonly` | [`ChannelGatewayLike`](/api/@graphorin/server/interfaces/ChannelGatewayLike.md) | [packages/server/src/channels/daemon.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L66) |

## Methods

### start()

```ts
start(): Promise<void>;
```

Defined in: [packages/server/src/channels/daemon.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L63)

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<ChannelGatewayStatusLike>;
```

Defined in: [packages/server/src/channels/daemon.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L65)

#### Returns

`Promise`\&lt;[`ChannelGatewayStatusLike`](/api/@graphorin/server/interfaces/ChannelGatewayStatusLike.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/server/src/channels/daemon.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L64)

#### Returns

`Promise`\&lt;`void`\&gt;
