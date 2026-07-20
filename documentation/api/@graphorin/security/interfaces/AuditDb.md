[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditDb

# Interface: AuditDb

Defined in: packages/security/src/audit/audit-db.ts:86

**`Stable`**

Minimal audit-database surface consumed by the chain operations.
Concrete bindings can expose more, but the contract is intentionally
small so the verifier remains binding-agnostic.

The methods are deliberately synchronous on the read path - the
single-file SQLite default is already in-process, and asynchrony
would add no I/O parallelism but would force every audit consumer
to plumb promise-state through hot loops.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-binding"></a> `binding` | `readonly` | [`AuditDbBindingId`](/api/@graphorin/security/type-aliases/AuditDbBindingId.md) | Stable identifier of the binding that produced this handle. | packages/security/src/audit/audit-db.ts:88 |
| <a id="property-close"></a> `close` | `readonly` | () => `Promise`\&lt;`void`\&gt; | Close the underlying handle. | packages/security/src/audit/audit-db.ts:125 |
| <a id="property-count"></a> `count` | `readonly` | () => `Promise`\&lt;`number`\&gt; | Total number of stored entries. | packages/security/src/audit/audit-db.ts:101 |
| <a id="property-deleteupto"></a> `deleteUpTo` | `readonly` | (`threshold`) => `Promise`\&lt;`number`\&gt; | Delete entries with `seq <= threshold`. Used by `pruneAudit`. | packages/security/src/audit/audit-db.ts:103 |
| <a id="property-insert"></a> `insert` | `readonly` | (`entry`) => `Promise`\&lt;[`StoredAuditEntry`](/api/@graphorin/security/interfaces/StoredAuditEntry.md)\&gt; | Append a new audit entry. The binding is responsible for atomicity. | packages/security/src/audit/audit-db.ts:92 |
| <a id="property-iterate"></a> `iterate` | `readonly` | (`bounds?`) => `AsyncIterable`\&lt;[`StoredAuditEntry`](/api/@graphorin/security/interfaces/StoredAuditEntry.md)\&gt; | Iterate stored entries in `seq` order. The optional bounds are inclusive. | packages/security/src/audit/audit-db.ts:96 |
| <a id="property-latest"></a> `latest` | `readonly` | () => `Promise`\&lt; \| [`StoredAuditEntry`](/api/@graphorin/security/interfaces/StoredAuditEntry.md) \| `undefined`\&gt; | Read the most-recent entry, used by `appendAudit` to compute `prev_hash`. | packages/security/src/audit/audit-db.ts:94 |
| <a id="property-path"></a> `path` | `readonly` | `string` | Path on disk. | packages/security/src/audit/audit-db.ts:90 |
| <a id="property-replaceentry"></a> `replaceEntry` | `readonly` | (`entry`) => `Promise`\&lt;`void`\&gt; | Replace a stored entry. The replacement preserves the `seq` primary key and overwrites `prevHash` and `hash`. Used by `pruneAudit` to root the surviving chain at the genesis prev-hash and recompute the rolling chain hashes. | packages/security/src/audit/audit-db.ts:110 |
| <a id="property-transact"></a> `transact?` | `readonly` | \&lt;`T`\&gt;(`fn`) => `Promise`\&lt;`T`\&gt; | OPTIONAL cross-process fence: run `fn` inside one write transaction on the underlying handle (`BEGIN IMMEDIATE` semantics - the write lock is held from entry to commit, and a failure rolls back). When present, `appendAudit` wraps its `latest()`+`insert()` read-modify-write in it so two PROCESSES sharing one audit file cannot both hash against the same tip, and `pruneAudit` runs its delete+rewrite atomically so a concurrent append never chains to a pre-prune tip. Additive: bindings without it keep compiling - `appendAudit` falls back to a bounded seq-conflict retry, and `pruneAudit` fails closed. | packages/security/src/audit/audit-db.ts:123 |
