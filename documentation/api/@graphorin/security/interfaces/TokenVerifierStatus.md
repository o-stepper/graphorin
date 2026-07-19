[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenVerifierStatus

# Interface: TokenVerifierStatus

Defined in: packages/security/src/auth/verify.ts:138

**`Stable`**

Diagnostic snapshot for the rate limiter and concurrent-verify cap.
Used by health endpoints / `graphorin doctor` once those ship.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cachesize"></a> `cacheSize` | `readonly` | `number` | - | packages/security/src/auth/verify.ts:139 |
| <a id="property-inflight"></a> `inFlight` | `readonly` | `number` | - | packages/security/src/auth/verify.ts:140 |
| <a id="property-peripfailures"></a> `perIpFailures` | `readonly` | `number` | Distinct IPs currently in the failure window map (SPL-19, capped). | packages/security/src/auth/verify.ts:142 |
| <a id="property-periplockouts"></a> `perIpLockouts` | `readonly` | `number` | - | packages/security/src/auth/verify.ts:143 |
| <a id="property-pertokenlockouts"></a> `perTokenLockouts` | `readonly` | `number` | - | packages/security/src/auth/verify.ts:144 |
