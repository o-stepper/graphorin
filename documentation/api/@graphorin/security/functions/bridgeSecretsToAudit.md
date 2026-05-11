[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / bridgeSecretsToAudit

# Function: bridgeSecretsToAudit()

```ts
function bridgeSecretsToAudit(options): SecretsBridgeTeardown;
```

Defined in: packages/security/src/audit/secrets-bridge.ts:61

Subscribe the audit-log subsystem to the secrets-layer audit
emitter. Returns a teardown function.

Writes are serialised through a per-bridge queue so concurrent
secrets events never race on `db.latest()` and produce duplicate
`seq` values. Failures are isolated from the secret access path
via the `onWriteError` callback.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`BridgeSecretsToAuditOptions`](/api/@graphorin/security/interfaces/BridgeSecretsToAuditOptions.md) |

## Returns

[`SecretsBridgeTeardown`](/api/@graphorin/security/interfaces/SecretsBridgeTeardown.md)

## Stable
