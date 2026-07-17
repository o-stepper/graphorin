[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ResolvedChannelRoute

# Interface: ResolvedChannelRoute

Defined in: [packages/channels/src/router.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/router.ts#L45)

The routing outcome: which agent handles the conversation and
under which session key.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | [packages/channels/src/router.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/router.ts#L46) |
| <a id="property-routeindex"></a> `routeIndex` | `readonly` | `number` | Index of the matched row in the supplied route table (audit). | [packages/channels/src/router.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/router.ts#L49) |
| <a id="property-sessionkey"></a> `sessionKey` | `readonly` | `string` | - | [packages/channels/src/router.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/router.ts#L47) |
