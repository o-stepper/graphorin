[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RetentionStoreLike

# Interface: RetentionStoreLike

Defined in: [packages/server/src/runtime/retention.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L67)

Structural slice of `GraphorinSqliteStore` the sweep consumes. Typed
structurally so custom store implementations (and test fakes) work;
a surface whose method is absent is skipped, never an error.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-checkpoints"></a> `checkpoints` | `readonly` | \{ `pruneThreads`: `Promise`\&lt;`number`\&gt;; \} | [packages/server/src/runtime/retention.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L79) |
| `checkpoints.pruneThreads` | `public` | `Promise`\&lt;`number`\&gt; | [packages/server/src/runtime/retention.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L80) |
| <a id="property-connection"></a> `connection` | `readonly` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) | [packages/server/src/runtime/retention.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L68) |
| <a id="property-idempotency"></a> `idempotency` | `readonly` | \{ `prune`: `Promise`\&lt;`number`\&gt;; \} | [packages/server/src/runtime/retention.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L85) |
| `idempotency.prune` | `public` | `Promise`\&lt;`number`\&gt; | [packages/server/src/runtime/retention.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L86) |
| <a id="property-memory"></a> `memory` | `readonly` | \{ `pruneHistory`: `Promise`\&lt;`number`\&gt;; \} | [packages/server/src/runtime/retention.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L76) |
| `memory.pruneHistory` | `public` | `Promise`\&lt;`number`\&gt; | [packages/server/src/runtime/retention.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L77) |
| <a id="property-sessions"></a> `sessions` | `readonly` | \{ `pruneAuditEntries`: `Promise`\&lt;`number`\&gt;; `pruneSessions`: `Promise`\&lt;`number`\&gt;; \} | [packages/server/src/runtime/retention.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L69) |
| `sessions.pruneAuditEntries` | `public` | `Promise`\&lt;`number`\&gt; | [packages/server/src/runtime/retention.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L74) |
| `sessions.pruneSessions` | `public` | `Promise`\&lt;`number`\&gt; | [packages/server/src/runtime/retention.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L70) |
