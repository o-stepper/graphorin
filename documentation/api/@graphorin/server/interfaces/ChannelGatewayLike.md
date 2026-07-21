[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ChannelGatewayLike

# Interface: ChannelGatewayLike

Defined in: packages/server/src/channels/daemon.ts:39

**`Stable`**

Structural surface of a channel gateway
(`createChannelGateway(...)` from `@graphorin/channels` satisfies
it; the server never imports that package).

## Methods

### setActivityListener()?

```ts
optional setActivityListener(listener): void;
```

Defined in: packages/server/src/channels/daemon.ts:48

Bridge seam: when present, the server registers a listener
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

Defined in: packages/server/src/channels/daemon.ts:40

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<ChannelGatewayStatusLike>;
```

Defined in: packages/server/src/channels/daemon.ts:42

#### Returns

`Promise`\&lt;[`ChannelGatewayStatusLike`](/api/@graphorin/server/interfaces/ChannelGatewayStatusLike.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/server/src/channels/daemon.ts:41

#### Returns

`Promise`\&lt;`void`\&gt;
