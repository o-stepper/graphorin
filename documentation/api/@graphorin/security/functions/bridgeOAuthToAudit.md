[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / bridgeOAuthToAudit

# Function: bridgeOAuthToAudit()

```ts
function bridgeOAuthToAudit(opts): OAuthBridgeTeardown;
```

Defined in: [packages/security/src/audit/oauth-bridge.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/oauth-bridge.ts#L39)

Subscribe the audit-log subsystem to the OAuth audit emitter.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`BridgeOAuthToAuditOptions`](/api/@graphorin/security/interfaces/BridgeOAuthToAuditOptions.md) |

## Returns

[`OAuthBridgeTeardown`](/api/@graphorin/security/interfaces/OAuthBridgeTeardown.md)

## Stable
