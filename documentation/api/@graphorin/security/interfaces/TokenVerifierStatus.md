[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenVerifierStatus

# Interface: TokenVerifierStatus

Defined in: packages/security/src/auth/verify.ts:130

Diagnostic snapshot for the rate limiter and concurrent-verify cap.
Used by health endpoints / `graphorin doctor` once those ship.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cachesize"></a> `cacheSize` | `readonly` | `number` | packages/security/src/auth/verify.ts:131 |
| <a id="property-inflight"></a> `inFlight` | `readonly` | `number` | packages/security/src/auth/verify.ts:132 |
| <a id="property-periplockouts"></a> `perIpLockouts` | `readonly` | `number` | packages/security/src/auth/verify.ts:133 |
| <a id="property-pertokenlockouts"></a> `perTokenLockouts` | `readonly` | `number` | packages/security/src/auth/verify.ts:134 |
