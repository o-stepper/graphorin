[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthRegistration

# Interface: OAuthRegistration

Defined in: packages/security/src/oauth/types.ts:119

Pre-registered OAuth client identifier and (optional) confidential
client secret. Skipping this triggers Dynamic Client Registration
the first time the client opens an authorization flow.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-clientid"></a> `clientId` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:120 |
| <a id="property-clientname"></a> `clientName?` | `readonly` | `string` | Human-readable name passed to the registration endpoint. | packages/security/src/oauth/types.ts:126 |
| <a id="property-clientsecret"></a> `clientSecret?` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | Confidential clients only. | packages/security/src/oauth/types.ts:122 |
| <a id="property-registeredvia"></a> `registeredVia?` | `readonly` | `"dcr"` \| `"manual"` | Set to `'dcr'` when the registration was produced by RFC 7591. | packages/security/src/oauth/types.ts:124 |
