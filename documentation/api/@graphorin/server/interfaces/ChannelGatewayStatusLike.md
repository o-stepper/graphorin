[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ChannelGatewayStatusLike

# Interface: ChannelGatewayStatusLike

Defined in: packages/server/src/channels/daemon.ts:27

**`Stable`**

Gateway status shape consumed by `/v1/health`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-channels"></a> `channels` | `readonly` | readonly [`ChannelStatusLike`](/api/@graphorin/server/interfaces/ChannelStatusLike.md)[] | packages/server/src/channels/daemon.ts:29 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | packages/server/src/channels/daemon.ts:28 |
