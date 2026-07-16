[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ChannelGatewayStatusLike

# Interface: ChannelGatewayStatusLike

Defined in: [packages/server/src/channels/daemon.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L27)

Gateway status shape consumed by `/v1/health`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-channels"></a> `channels` | `readonly` | readonly [`ChannelStatusLike`](/api/@graphorin/server/interfaces/ChannelStatusLike.md)[] | [packages/server/src/channels/daemon.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L29) |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | [packages/server/src/channels/daemon.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L28) |
