[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / appendAudit

# Function: appendAudit()

```ts
function appendAudit(db, input): Promise<StoredAuditEntry>;
```

Defined in: packages/security/src/audit/append.ts:82

**`Stable`**

Append a single audit entry. The function is `async` so it can run
the canonical-JSON serializer + SHA-256 in a worker pool in a
future revision; today it is synchronous on the inside.

Concurrent calls against the same `AuditDb` are serialised so the
`latest()`→`insert()` read-modify-write never races.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) |
| `input` | [`AuditEntryInput`](/api/@graphorin/security/interfaces/AuditEntryInput.md) |

## Returns

`Promise`\&lt;[`StoredAuditEntry`](/api/@graphorin/security/interfaces/StoredAuditEntry.md)\&gt;
