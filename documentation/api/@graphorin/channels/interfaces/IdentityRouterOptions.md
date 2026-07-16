[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / IdentityRouterOptions

# Interface: IdentityRouterOptions

Defined in: [packages/channels/src/router.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/router.ts#L53)

Options for [createIdentityRouter](/api/@graphorin/channels/functions/createIdentityRouter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-routes"></a> `routes` | `readonly` | readonly [`ChannelRoute`](/api/@graphorin/channels/interfaces/ChannelRoute.md)[] | Ordered route table; first match wins. Must contain a catch-all default route. | [packages/channels/src/router.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/router.ts#L55) |
