[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / PairingPolicyOptions

# Interface: PairingPolicyOptions

Defined in: packages/channels/src/access.ts:43

**`Stable`**

Tuning for the `'pairing'` policy.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-codelength"></a> `codeLength?` | `readonly` | `number` | Code length. Default 8. | packages/channels/src/access.ts:49 |
| <a id="property-maxpendingperchannel"></a> `maxPendingPerChannel?` | `readonly` | `number` | Cap on simultaneously pending codes per channel. Default 3. | packages/channels/src/access.ts:47 |
| <a id="property-ttlms"></a> `ttlMs?` | `readonly` | `number` | Pairing-code lifetime. Default 1 hour. | packages/channels/src/access.ts:45 |
