[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / AuditErrorSink

# Type Alias: AuditErrorSink

```ts
type AuditErrorSink = (err, entry) => void;
```

Defined in: packages/server/src/middleware/audit.ts:37

**`Stable`**

Optional telemetry sink. The default ignores errors; production
deployments wire this into their structured logger.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `err` | `unknown` |
| `entry` | `Omit`\&lt;[`AuditEntryInput`](/api/@graphorin/security/interfaces/AuditEntryInput.md), `"ts"`\&gt; |

## Returns

`void`
