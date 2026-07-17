[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / PairingPolicyOptions

# Interface: PairingPolicyOptions

Defined in: [packages/channels/src/access.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/access.ts#L43)

Tuning for the `'pairing'` policy.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-codelength"></a> `codeLength?` | `readonly` | `number` | Code length. Default 8. | [packages/channels/src/access.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/access.ts#L49) |
| <a id="property-maxpendingperchannel"></a> `maxPendingPerChannel?` | `readonly` | `number` | Cap on simultaneously pending codes per channel. Default 3. | [packages/channels/src/access.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/access.ts#L47) |
| <a id="property-ttlms"></a> `ttlMs?` | `readonly` | `number` | Pairing-code lifetime. Default 1 hour. | [packages/channels/src/access.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/access.ts#L45) |
