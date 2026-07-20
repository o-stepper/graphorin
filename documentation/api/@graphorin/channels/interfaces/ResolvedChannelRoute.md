[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ResolvedChannelRoute

# Interface: ResolvedChannelRoute

Defined in: packages/channels/src/router.ts:45

**`Stable`**

The routing outcome: which agent handles the conversation and
under which session key.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/channels/src/router.ts:46 |
| <a id="property-routeindex"></a> `routeIndex` | `readonly` | `number` | Index of the matched row in the supplied route table (audit). | packages/channels/src/router.ts:49 |
| <a id="property-sessionkey"></a> `sessionKey` | `readonly` | `string` | - | packages/channels/src/router.ts:47 |
