[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretStrength

# Interface: SecretStrength

Defined in: packages/security/src/hardening/weak-secret.ts:31

Result of [assessSecretStrength](/api/@graphorin/security/functions/assessSecretStrength.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-bytelength"></a> `byteLength` | `readonly` | `number` | - | packages/security/src/hardening/weak-secret.ts:34 |
| <a id="property-distinctbytes"></a> `distinctBytes` | `readonly` | `number` | Number of distinct byte values. | packages/security/src/hardening/weak-secret.ts:40 |
| <a id="property-maxidenticalrun"></a> `maxIdenticalRun` | `readonly` | `number` | Longest run of identical consecutive bytes. | packages/security/src/hardening/weak-secret.ts:38 |
| <a id="property-ok"></a> `ok` | `readonly` | `boolean` | Whether the secret cleared every threshold. | packages/security/src/hardening/weak-secret.ts:33 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | Human-readable reason when `ok` is `false`. | packages/security/src/hardening/weak-secret.ts:42 |
| <a id="property-shannonbitsperbyte"></a> `shannonBitsPerByte` | `readonly` | `number` | Estimated Shannon entropy of the byte distribution (bits/byte). | packages/security/src/hardening/weak-secret.ts:36 |
