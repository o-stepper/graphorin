[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DynamicClientRegistrationResult

# Interface: DynamicClientRegistrationResult

Defined in: packages/security/src/oauth/types.ts:134

**`Stable`**

Result of the Dynamic Client Registration round-trip.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-clientid"></a> `clientId` | `readonly` | `string` | packages/security/src/oauth/types.ts:135 |
| <a id="property-clientidissuedat"></a> `clientIdIssuedAt?` | `readonly` | `number` | packages/security/src/oauth/types.ts:137 |
| <a id="property-clientsecret"></a> `clientSecret?` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | packages/security/src/oauth/types.ts:136 |
| <a id="property-clientsecretexpiresat"></a> `clientSecretExpiresAt?` | `readonly` | `number` | packages/security/src/oauth/types.ts:138 |
| <a id="property-raw"></a> `raw?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/security/src/oauth/types.ts:139 |
