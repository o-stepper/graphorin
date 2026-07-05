[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / checkEncryption

# Function: checkEncryption()

```ts
function checkEncryption(): CheckResult[];
```

Defined in: packages/security/src/hardening/doctor.ts:166

Verify that an encrypted-SQLite binding is registered for the
audit log. The framework refuses to open the audit log without an
encrypted binding, so the doctor surfaces the missing binding as
`'fail'`.

## Returns

[`CheckResult`](/api/@graphorin/security/interfaces/CheckResult.md)[]

## Stable
