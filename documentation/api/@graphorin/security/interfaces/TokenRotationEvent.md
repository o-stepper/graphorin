[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenRotationEvent

# Interface: TokenRotationEvent

Defined in: packages/security/src/oauth/types.ts:299

Snapshot passed to [OAuthStrategy.onTokenRotation](/api/@graphorin/security/interfaces/OAuthStrategy.md#property-ontokenrotation).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-issuedat"></a> `issuedAt` | `readonly` | `number` | packages/security/src/oauth/types.ts:304 |
| <a id="property-nextscope"></a> `nextScope?` | `readonly` | `string` | packages/security/src/oauth/types.ts:303 |
| <a id="property-previousscope"></a> `previousScope?` | `readonly` | `string` | packages/security/src/oauth/types.ts:302 |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | packages/security/src/oauth/types.ts:300 |
| <a id="property-serverurl"></a> `serverUrl` | `readonly` | `string` | packages/security/src/oauth/types.ts:301 |
