[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / checkSecrets

# Function: checkSecrets()

```ts
function checkSecrets(): CheckResult[];
```

Defined in: packages/security/src/hardening/doctor.ts:120

**`Stable`**

Wrapper around `getSecretsStoreStatus(...)` from the secrets
subsystem. Surfaces any active downgrade as a `'warn'` and
`--strict-secrets` failure as `'fail'`.

## Returns

[`CheckResult`](/api/@graphorin/security/interfaces/CheckResult.md)[]
