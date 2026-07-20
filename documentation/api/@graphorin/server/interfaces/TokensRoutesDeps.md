[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TokensRoutesDeps

# Interface: TokensRoutesDeps

Defined in: packages/server/src/routes/tokens.ts:23

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowedenvs"></a> `allowedEnvs` | `readonly` | readonly `string`[] | - | packages/server/src/routes/tokens.ts:27 |
| <a id="property-defaultenv"></a> `defaultEnv` | `readonly` | `string` | - | packages/server/src/routes/tokens.ts:26 |
| <a id="property-pepper"></a> `pepper` | `readonly` | `SecretValue$1` | - | packages/server/src/routes/tokens.ts:25 |
| <a id="property-tokenstore"></a> `tokenStore` | `readonly` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) | - | packages/server/src/routes/tokens.ts:24 |
| <a id="property-verifier"></a> `verifier?` | `readonly` | \{ `invalidate`: `void`; \} | The live token verifier, so a REST revoke invalidates its LRU entry immediately - otherwise a just-used token keeps authenticating from the cache for up to `cacheTtlMaxMs` (60s). | packages/server/src/routes/tokens.ts:33 |
| `verifier.invalidate` | `public` | `void` | - | packages/server/src/routes/tokens.ts:33 |
