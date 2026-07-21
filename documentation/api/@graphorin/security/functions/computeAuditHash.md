[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / computeAuditHash

# Function: computeAuditHash()

```ts
function computeAuditHash(entry): string;
```

Defined in: packages/security/src/audit/append.ts:41

**`Stable`**

Compute the SHA-256 chain hash for an entry. Exposed for tests and
for tooling that wants to recompute hashes outside the verifier.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | `Omit`\&lt;[`StoredAuditEntry`](/api/@graphorin/security/interfaces/StoredAuditEntry.md), `"hash"`\&gt; |

## Returns

`string`
