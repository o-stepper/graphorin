[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DynamicClientRegistrationResult

# Interface: DynamicClientRegistrationResult

Defined in: [packages/security/src/oauth/types.ts:134](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L134)

Result of the Dynamic Client Registration round-trip.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-clientid"></a> `clientId` | `readonly` | `string` | [packages/security/src/oauth/types.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L135) |
| <a id="property-clientidissuedat"></a> `clientIdIssuedAt?` | `readonly` | `number` | [packages/security/src/oauth/types.ts:137](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L137) |
| <a id="property-clientsecret"></a> `clientSecret?` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | [packages/security/src/oauth/types.ts:136](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L136) |
| <a id="property-clientsecretexpiresat"></a> `clientSecretExpiresAt?` | `readonly` | `number` | [packages/security/src/oauth/types.ts:138](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L138) |
| <a id="property-raw"></a> `raw?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/security/src/oauth/types.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L139) |
