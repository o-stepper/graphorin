[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ChannelsDaemon

# Interface: ChannelsDaemon

Defined in: packages/server/src/channels/daemon.ts:62

**`Stable`**

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-gateway"></a> `gateway` | `readonly` | [`ChannelGatewayLike`](/api/@graphorin/server/interfaces/ChannelGatewayLike.md) | packages/server/src/channels/daemon.ts:66 |

## Methods

### start()

```ts
start(): Promise<void>;
```

Defined in: packages/server/src/channels/daemon.ts:63

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<ChannelGatewayStatusLike>;
```

Defined in: packages/server/src/channels/daemon.ts:65

#### Returns

`Promise`\&lt;[`ChannelGatewayStatusLike`](/api/@graphorin/server/interfaces/ChannelGatewayStatusLike.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/server/src/channels/daemon.ts:64

#### Returns

`Promise`\&lt;`void`\&gt;
