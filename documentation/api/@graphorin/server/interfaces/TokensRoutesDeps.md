[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TokensRoutesDeps

# Interface: TokensRoutesDeps

Defined in: [packages/server/src/routes/tokens.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/tokens.ts#L23)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowedenvs"></a> `allowedEnvs` | `readonly` | readonly `string`[] | - | [packages/server/src/routes/tokens.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/tokens.ts#L27) |
| <a id="property-defaultenv"></a> `defaultEnv` | `readonly` | `string` | - | [packages/server/src/routes/tokens.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/tokens.ts#L26) |
| <a id="property-pepper"></a> `pepper` | `readonly` | `SecretValue$1` | - | [packages/server/src/routes/tokens.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/tokens.ts#L25) |
| <a id="property-tokenstore"></a> `tokenStore` | `readonly` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) | - | [packages/server/src/routes/tokens.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/tokens.ts#L24) |
| <a id="property-verifier"></a> `verifier?` | `readonly` | \{ `invalidate`: `void`; \} | TOKENS-RE-01 / SPL-9: the live token verifier, so a REST revoke invalidates its LRU entry immediately - otherwise a just-used token keeps authenticating from the cache for up to `cacheTtlMaxMs` (60s). | [packages/server/src/routes/tokens.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/tokens.ts#L33) |
| `verifier.invalidate` | `public` | `void` | - | [packages/server/src/routes/tokens.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/tokens.ts#L33) |
