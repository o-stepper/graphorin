[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DynamicClientRegistrationResult

# Interface: DynamicClientRegistrationResult

Defined in: packages/security/src/oauth/types.ts:119

Result of the Dynamic Client Registration round-trip.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-clientid"></a> `clientId` | `readonly` | `string` | packages/security/src/oauth/types.ts:120 |
| <a id="property-clientidissuedat"></a> `clientIdIssuedAt?` | `readonly` | `number` | packages/security/src/oauth/types.ts:122 |
| <a id="property-clientsecret"></a> `clientSecret?` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | packages/security/src/oauth/types.ts:121 |
| <a id="property-clientsecretexpiresat"></a> `clientSecretExpiresAt?` | `readonly` | `number` | packages/security/src/oauth/types.ts:123 |
| <a id="property-raw"></a> `raw?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/security/src/oauth/types.ts:124 |
