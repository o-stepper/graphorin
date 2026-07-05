[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [commentary](/api/@graphorin/server/commentary/index.md) / bridgeCommentaryToAudit

# Function: bridgeCommentaryToAudit()

```ts
function bridgeCommentaryToAudit(db, onWriteError?): CommentaryAuditSink;
```

Defined in: packages/server/src/commentary/audit-bridge.ts:72

Build a commentary sink that appends each sanitization decision to the audit
log. Writes serialise through `appendAudit` so concurrent decisions never
race on `seq`; a failed write is isolated from the wire - `onWriteError`
(default: a console warning) runs instead of throwing.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `db` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) | `undefined` |
| `onWriteError` | (`decision`, `error`) => `void` | `defaultOnWriteError` |

## Returns

[`CommentaryAuditSink`](/api/@graphorin/server/commentary/interfaces/CommentaryAuditSink.md)

## Stable
