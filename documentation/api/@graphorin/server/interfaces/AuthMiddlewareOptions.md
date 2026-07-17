[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / AuthMiddlewareOptions

# Interface: AuthMiddlewareOptions

Defined in: [packages/server/src/middleware/auth.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/auth.ts#L57)

Options accepted by [createAuthMiddleware](/api/@graphorin/server/functions/createAuthMiddleware.md). Tests inject a
stub verifier; production wiring uses the verifier built during the
server's pre-bind step.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowanonymous"></a> `allowAnonymous?` | `readonly` | `boolean` | Whether to allow unauthenticated requests through. Used by `health` and (when explicitly opted-in) by the public read endpoints. When `false` (the default), missing / malformed / invalid tokens short-circuit the request with `401`. | [packages/server/src/middleware/auth.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/auth.ts#L65) |
| <a id="property-verifier"></a> `verifier` | `readonly` | [`TokenVerifier`](/api/@graphorin/security/classes/TokenVerifier.md) | - | [packages/server/src/middleware/auth.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/auth.ts#L58) |
