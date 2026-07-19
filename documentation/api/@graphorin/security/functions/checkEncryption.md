[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / checkEncryption

# Function: checkEncryption()

```ts
function checkEncryption(options?): CheckResult[];
```

Defined in: packages/security/src/hardening/doctor.ts:169

**`Stable`**

Verify that an encrypted-SQLite binding is registered for the
audit log. The framework refuses to open the audit log without an
encrypted binding, so the doctor surfaces the missing binding as
`'fail'` - unless the supplied config has the audit log DISABLED, in
which case the binding is not required and the check reports `'skip'`
(a fresh `init --no-encrypted` + `doctor --all` must not fail on a
subsystem the config turned off).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `auditEnabled?`: `boolean`; \} |
| `options.auditEnabled?` | `boolean` |

## Returns

[`CheckResult`](/api/@graphorin/security/interfaces/CheckResult.md)[]
