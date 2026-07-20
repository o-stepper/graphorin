[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / CreateAccessControllerOptions

# Interface: CreateAccessControllerOptions

Defined in: packages/channels/src/access.ts:124

**`Stable`**

Options for [createAccessController](/api/@graphorin/channels/functions/createAccessController.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-generatecode"></a> `generateCode?` | `readonly` | () => `string` | Code generator seam (tests). Default: crypto-random over an unambiguous alphabet. | packages/channels/src/access.ts:131 |
| <a id="property-now"></a> `now?` | `readonly` | () => `Date` | Clock seam (tests). Default `() => new Date()`. | packages/channels/src/access.ts:129 |
| <a id="property-policy"></a> `policy` | `readonly` | [`ChannelAccessPolicyConfig`](/api/@graphorin/channels/interfaces/ChannelAccessPolicyConfig.md) | - | packages/channels/src/access.ts:125 |
| <a id="property-store"></a> `store?` | `readonly` | [`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md) | Required when `policy.kind` is `'pairing'`. | packages/channels/src/access.ts:127 |
