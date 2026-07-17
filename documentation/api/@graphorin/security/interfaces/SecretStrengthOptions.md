[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretStrengthOptions

# Interface: SecretStrengthOptions

Defined in: [packages/security/src/hardening/weak-secret.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/weak-secret.ts#L18)

Tunable thresholds for [assessSecretStrength](/api/@graphorin/security/functions/assessSecretStrength.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxidenticalrun"></a> `maxIdenticalRun?` | `readonly` | `number` | Reject when this many identical bytes appear consecutively. Default `8`. | [packages/security/src/hardening/weak-secret.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/weak-secret.ts#L27) |
| <a id="property-minbytes"></a> `minBytes?` | `readonly` | `number` | Minimum byte length. Default `32`. | [packages/security/src/hardening/weak-secret.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/weak-secret.ts#L20) |
| <a id="property-minshannonbitsperbyte"></a> `minShannonBitsPerByte?` | `readonly` | `number` | Minimum Shannon entropy in bits per byte. Default `3`. | [packages/security/src/hardening/weak-secret.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/weak-secret.ts#L22) |
