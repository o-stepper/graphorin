[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthSessionMetadata

# Interface: OAuthSessionMetadata

Defined in: packages/security/src/oauth/types.ts:167

**`Stable`**

Audit-safe view of an OAuth session - never carries token material.
Used by `listOAuthSessions(...)` and the `/v1/health/secrets`
surface (Phase 14a).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-clientid"></a> `clientId` | `readonly` | `string` | packages/security/src/oauth/types.ts:170 |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `number` | packages/security/src/oauth/types.ts:173 |
| <a id="property-hasaccesstoken"></a> `hasAccessToken` | `readonly` | `boolean` | packages/security/src/oauth/types.ts:176 |
| <a id="property-hasrefreshtoken"></a> `hasRefreshToken` | `readonly` | `boolean` | packages/security/src/oauth/types.ts:177 |
| <a id="property-issuer"></a> `issuer?` | `readonly` | `string` | packages/security/src/oauth/types.ts:171 |
| <a id="property-lastrefreshedat"></a> `lastRefreshedAt?` | `readonly` | `number` | packages/security/src/oauth/types.ts:174 |
| <a id="property-registeredvia"></a> `registeredVia?` | `readonly` | `"dcr"` \| `"manual"` | packages/security/src/oauth/types.ts:175 |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | packages/security/src/oauth/types.ts:172 |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | packages/security/src/oauth/types.ts:168 |
| <a id="property-serverurl"></a> `serverUrl` | `readonly` | `string` | packages/security/src/oauth/types.ts:169 |
| <a id="property-status"></a> `status` | `readonly` | `"unknown"` \| `"expired"` \| `"fresh"` \| `"expiring-soon"` | packages/security/src/oauth/types.ts:178 |
