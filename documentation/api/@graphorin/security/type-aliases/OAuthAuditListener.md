[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthAuditListener

# Type Alias: OAuthAuditListener

```ts
type OAuthAuditListener = (event) => void;
```

Defined in: packages/security/src/oauth/audit-emitter.ts:66

**`Stable`**

Callback shape accepted by [onOAuthAudit](/api/@graphorin/security/functions/onOAuthAudit.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`OAuthAuditEvent`](/api/@graphorin/security/interfaces/OAuthAuditEvent.md) |

## Returns

`void`
