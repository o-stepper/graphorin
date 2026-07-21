[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / bridgeMemoryGuardToAudit

# Function: bridgeMemoryGuardToAudit()

```ts
function bridgeMemoryGuardToAudit(opts): MemoryGuardBridgeTeardown;
```

Defined in: packages/security/src/audit/memory-guard-bridge.ts:55

**`Stable`**

Subscribe the audit-log subsystem to the guard audit emitter.
Returns a teardown function.

Writes are serialised through a per-bridge queue so concurrent
guard events never race on `db.latest()` and produce duplicate
`seq` values. Failures are isolated from the guard fast path via
the `onWriteError` callback.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`BridgeMemoryGuardToAuditOptions`](/api/@graphorin/security/interfaces/BridgeMemoryGuardToAuditOptions.md) |

## Returns

[`MemoryGuardBridgeTeardown`](/api/@graphorin/security/interfaces/MemoryGuardBridgeTeardown.md)
