[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / bridgeAuthToAudit

# Function: bridgeAuthToAudit()

```ts
function bridgeAuthToAudit(options): AuthBridgeTeardown;
```

Defined in: packages/security/src/audit/auth-bridge.ts:38

Subscribe the audit-log subsystem to the auth-layer audit emitter
(SPL-5). Token mint / revoke / rotate / rekey and every verification
outcome (granted, unauth, scope-denied, lockout) land in the chain.
Writes serialise through `appendAudit` (SPL-4) so concurrent events
never race on `seq`; a failed write is isolated from the auth path
and logged (never swallowed) when no `onWriteError` is supplied.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`BridgeAuthToAuditOptions`](/api/@graphorin/security/interfaces/BridgeAuthToAuditOptions.md) |

## Returns

[`AuthBridgeTeardown`](/api/@graphorin/security/interfaces/AuthBridgeTeardown.md)

## Stable
