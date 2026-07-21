[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / bridgeSecretsToAudit

# Function: bridgeSecretsToAudit()

```ts
function bridgeSecretsToAudit(options): SecretsBridgeTeardown;
```

Defined in: packages/security/src/audit/secrets-bridge.ts:64

**`Stable`**

Subscribe the audit-log subsystem to the secrets-layer audit
emitter. Returns a teardown function.

Writes are serialised through a per-bridge queue (and also at the
source inside `appendAudit`, which serialises every
caller of one `AuditDb`) so concurrent secrets events never race on
`db.latest()` and produce duplicate `seq` values. A failed write is
isolated from the secret access path via the `onWriteError` callback;
when none is supplied it is logged (never swallowed) so a dropped
audit entry stays visible.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`BridgeSecretsToAuditOptions`](/api/@graphorin/security/interfaces/BridgeSecretsToAuditOptions.md) |

## Returns

[`SecretsBridgeTeardown`](/api/@graphorin/security/interfaces/SecretsBridgeTeardown.md)
