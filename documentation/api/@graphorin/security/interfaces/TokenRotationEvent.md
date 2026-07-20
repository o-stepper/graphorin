[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenRotationEvent

# Interface: TokenRotationEvent

Defined in: packages/security/src/oauth/types.ts:314

**`Stable`**

Snapshot passed to [OAuthStrategy.onTokenRotation](/api/@graphorin/security/interfaces/OAuthStrategy.md#property-ontokenrotation).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-issuedat"></a> `issuedAt` | `readonly` | `number` | packages/security/src/oauth/types.ts:319 |
| <a id="property-nextscope"></a> `nextScope?` | `readonly` | `string` | packages/security/src/oauth/types.ts:318 |
| <a id="property-previousscope"></a> `previousScope?` | `readonly` | `string` | packages/security/src/oauth/types.ts:317 |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | packages/security/src/oauth/types.ts:315 |
| <a id="property-serverurl"></a> `serverUrl` | `readonly` | `string` | packages/security/src/oauth/types.ts:316 |
