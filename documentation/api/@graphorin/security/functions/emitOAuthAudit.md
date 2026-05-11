[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / emitOAuthAudit

# Function: emitOAuthAudit()

```ts
function emitOAuthAudit(event): void;
```

Defined in: packages/security/src/oauth/audit-emitter.ts:86

Emit an event to every subscriber. Listeners that throw are
isolated — a faulty listener never tears down the OAuth fast
path.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`OAuthAuditEvent`](/api/@graphorin/security/interfaces/OAuthAuditEvent.md) |

## Returns

`void`

## Stable
