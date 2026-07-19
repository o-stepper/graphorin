[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / pruneAudit

# Function: pruneAudit()

```ts
function pruneAudit(db, options): Promise<PruneAuditResult>;
```

Defined in: packages/security/src/audit/prune.ts:101

**`Stable`**

Drop entries older than `before`, leaving at least `retain`
entries. Maintains the chain integrity by rewriting the first
surviving entry's `prevHash` to the genesis value.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) |
| `options` | [`PruneAuditOptions`](/api/@graphorin/security/interfaces/PruneAuditOptions.md) |

## Returns

`Promise`\&lt;[`PruneAuditResult`](/api/@graphorin/security/interfaces/PruneAuditResult.md)\&gt;
