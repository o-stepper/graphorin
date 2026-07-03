[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / VerifierOptions

# Interface: VerifierOptions

Defined in: packages/security/src/auth/verify.ts:84

Options that govern the rate-limit, lockout, and cache behaviour of
the verify pipeline.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptenvironments"></a> `acceptEnvironments?` | `readonly` | readonly `string`[] | Optional accepted environments override for `parseToken(...)`. | packages/security/src/auth/verify.ts:95 |
| <a id="property-acceptprefix"></a> `acceptPrefix?` | `readonly` | `string` | Optional accepted prefix override for `parseToken(...)`. | packages/security/src/auth/verify.ts:93 |
| <a id="property-cachecapacity"></a> `cacheCapacity?` | `readonly` | `number` | Cache size for the warm-path lookup. Defaults to 1024. | packages/security/src/auth/verify.ts:97 |
| <a id="property-cachettlmaxms"></a> `cacheTtlMaxMs?` | `readonly` | `number` | Hard cap on cache TTL in ms. Defaults to 60 000 (60 s). | packages/security/src/auth/verify.ts:99 |
| <a id="property-maxconcurrentverify"></a> `maxConcurrentVerify?` | `readonly` | `number` | Concurrent-verify cap. Defaults to 100. | packages/security/src/auth/verify.ts:111 |
| <a id="property-maxtrackedips"></a> `maxTrackedIps?` | `readonly` | `number` | Cap on distinct IPs tracked in the failure/lockout maps (SPL-19). Default 10 000 — overflow sweeps expired lockouts, then evicts the oldest entries. | packages/security/src/auth/verify.ts:117 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Wall-clock provider for testing. Defaults to `Date.now`. | packages/security/src/auth/verify.ts:119 |
| <a id="property-pepper"></a> `pepper` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | Pepper used to derive the per-token HMAC. The pepper is supplied as a `SecretValue` so its bytes never live in a plain string at rest. | packages/security/src/auth/verify.ts:91 |
| <a id="property-peripfailurethreshold"></a> `perIpFailureThreshold?` | `readonly` | `number` | Per-IP failure threshold inside the sliding window. Defaults to 5. | packages/security/src/auth/verify.ts:101 |
| <a id="property-periplockoutms"></a> `perIpLockoutMs?` | `readonly` | `number` | Lockout duration in ms after the per-IP counter trips. Defaults to 5 * 60 000 (5 min). | packages/security/src/auth/verify.ts:105 |
| <a id="property-peripwindowms"></a> `perIpWindowMs?` | `readonly` | `number` | Sliding-window length in ms for the per-IP counter. Defaults to 60 000 (60 s). | packages/security/src/auth/verify.ts:103 |
| <a id="property-pertokenfailurethreshold"></a> `perTokenFailureThreshold?` | `readonly` | `number` | Per-token failure threshold. Defaults to 10. | packages/security/src/auth/verify.ts:107 |
| <a id="property-pertokenwindowms"></a> `perTokenWindowMs?` | `readonly` | `number` | Sliding-window length in ms for the per-token counter. Defaults to 5 * 60 000 (5 min). | packages/security/src/auth/verify.ts:109 |
| <a id="property-tokenstore"></a> `tokenStore` | `readonly` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) | - | packages/security/src/auth/verify.ts:85 |
