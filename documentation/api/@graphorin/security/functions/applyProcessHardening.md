[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / applyProcessHardening

# Function: applyProcessHardening()

```ts
function applyProcessHardening(opts?): HardeningStatus;
```

Defined in: packages/security/src/hardening/apply.ts:83

Apply process-level hardening. The function returns the resolved
status so consumers can record it (e.g. forward to the audit log).
Calling it more than once returns the same status; the umask is
not changed on subsequent calls.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`ApplyProcessHardeningOptions`](/api/@graphorin/security/interfaces/ApplyProcessHardeningOptions.md) |

## Returns

[`HardeningStatus`](/api/@graphorin/security/interfaces/HardeningStatus.md)

## Stable
