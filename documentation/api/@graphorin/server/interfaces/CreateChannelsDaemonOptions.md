[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / CreateChannelsDaemonOptions

# Interface: CreateChannelsDaemonOptions

Defined in: [packages/server/src/channels/daemon.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L52)

Options for [createChannelsDaemon](/api/@graphorin/server/functions/createChannelsDaemon.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-gateway"></a> `gateway` | `readonly` | [`ChannelGatewayLike`](/api/@graphorin/server/interfaces/ChannelGatewayLike.md) | - | [packages/server/src/channels/daemon.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L53) |
| <a id="property-stoptimeoutms"></a> `stopTimeoutMs?` | `readonly` | `number` | Hard ceiling on `stop()`. Default 10s. | [packages/server/src/channels/daemon.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L55) |
| <a id="property-warn"></a> `warn?` | `readonly` | (`line`) => `void` | - | [packages/server/src/channels/daemon.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/channels/daemon.ts#L56) |
