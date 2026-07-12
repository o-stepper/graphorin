[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / CreateAccessControllerOptions

# Interface: CreateAccessControllerOptions

Defined in: [packages/channels/src/access.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/access.ts#L124)

Options for [createAccessController](/api/@graphorin/channels/functions/createAccessController.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-generatecode"></a> `generateCode?` | `readonly` | () => `string` | Code generator seam (tests). Default: crypto-random over an unambiguous alphabet. | [packages/channels/src/access.ts:131](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/access.ts#L131) |
| <a id="property-now"></a> `now?` | `readonly` | () => `Date` | Clock seam (tests). Default `() => new Date()`. | [packages/channels/src/access.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/access.ts#L129) |
| <a id="property-policy"></a> `policy` | `readonly` | [`ChannelAccessPolicyConfig`](/api/@graphorin/channels/interfaces/ChannelAccessPolicyConfig.md) | - | [packages/channels/src/access.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/access.ts#L125) |
| <a id="property-store"></a> `store?` | `readonly` | [`PairingStore`](/api/@graphorin/core/interfaces/PairingStore.md) | Required when `policy.kind` is `'pairing'`. | [packages/channels/src/access.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/access.ts#L127) |
