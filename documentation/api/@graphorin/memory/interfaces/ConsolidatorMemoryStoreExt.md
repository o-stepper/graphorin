[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorMemoryStoreExt

# Interface: ConsolidatorMemoryStoreExt

Defined in: packages/memory/src/internal/storage-adapter.ts:552

**`Stable`**

Optional consolidator-state surface every storage adapter exposes
for Phase 10c. Mirrors the `consolidator_state`,
`consolidator_runs`, and `consolidator_failed_batches` tables
shipped in Phase 05's migration 009. Adapters that do not
implement the surface degrade gracefully - the consolidator runs
in stateless mode (no DLQ, no cursor persistence) and emits a
one-shot WARN.

## Methods

### acquireLock()

```ts
acquireLock(
   scope, 
   runId, 
   now, 
maxAgeMs): Promise<boolean>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:562

Atomically claim the per-scope lock. Returns `true` when the
row was either unlocked, owned by `runId`, or stale (the held
timestamp is older than `maxAgeMs`); `false` otherwise. The
`now` argument allows the lock manager to inject a deterministic
clock during tests.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `runId` | `string` |
| `now` | `number` |
| `maxAgeMs` | `number` |

#### Returns

`Promise`\&lt;`boolean`\&gt;

***

### claimReadyBatches()

```ts
claimReadyBatches(
   scope, 
   now, 
limit?): Promise<readonly DlqBatchRow[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:590

Claim every DLQ row whose `nextRetryAt` is at or before `now`,
up to `limit`. Returns the rows in failed-at order so the
oldest backlog drains first.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `now` | `number` |
| `limit?` | `number` |

#### Returns

`Promise`\&lt;readonly [`DlqBatchRow`](/api/@graphorin/memory/interfaces/DlqBatchRow.md)[]\&gt;

***

### enqueueFailedBatch()

```ts
enqueueFailedBatch(input): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:584

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`DlqBatchInput`](/api/@graphorin/memory/interfaces/DlqBatchInput.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### getState()

```ts
getState(scope): Promise<
  | ConsolidatorStateRow
| null>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:553

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\<
  \| [`ConsolidatorStateRow`](/api/@graphorin/memory/interfaces/ConsolidatorStateRow.md)
  \| `null`\>

***

### listFailedBatches()

```ts
listFailedBatches(scope, limit?): Promise<readonly DlqBatchRow[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:613

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `limit?` | `number` |

#### Returns

`Promise`\&lt;readonly [`DlqBatchRow`](/api/@graphorin/memory/interfaces/DlqBatchRow.md)[]\&gt;

***

### listRecentRuns()

```ts
listRecentRuns(scope, limit?): Promise<readonly {
  factsCreated: number;
  factsUpdated: number;
  finishedAt: number | null;
  id: string;
  llmCostUsd: number | null;
  llmTokensUsed: number;
  phase: "light" | "standard" | "deep";
  startedAt: number;
  status: string;
}[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:567

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `limit?` | `number` |

#### Returns

`Promise`\<readonly \{
  `factsCreated`: `number`;
  `factsUpdated`: `number`;
  `finishedAt`: `number` \| `null`;
  `id`: `string`;
  `llmCostUsd`: `number` \| `null`;
  `llmTokensUsed`: `number`;
  `phase`: `"light"` \| `"standard"` \| `"deep"`;
  `startedAt`: `number`;
  `status`: `string`;
\}[]\>

***

### markBatchExhausted()

```ts
markBatchExhausted(
   id, 
   errorMessage, 
retryCount?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:612

Mark the row exhausted (`retryCount` exceeded the configured
cap). The row stays in the DLQ for operator inspection.
Implementations MUST clear `nextRetryAt` so the row is no
longer eligible for `claimReadyBatches`. The optional
`retryCount` argument is recorded against the row so the
persisted count reflects the final attempt that triggered the
exhaustion.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `errorMessage` | `string` |
| `retryCount?` | `number` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### markBatchSucceeded()

```ts
markBatchSucceeded(id): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:596

Mark the row succeeded - removes it from the DLQ.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### recordRunFinish()

```ts
recordRunFinish(finish): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:566

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `finish` | [`ConsolidatorRunFinish`](/api/@graphorin/memory/interfaces/ConsolidatorRunFinish.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### recordRunStart()

```ts
recordRunStart(input): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:565

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ConsolidatorRunInput`](/api/@graphorin/memory/interfaces/ConsolidatorRunInput.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### releaseLock()

```ts
releaseLock(scope, runId): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:563

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `runId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### rescheduleBatch()

```ts
rescheduleBatch(
   id, 
   retryCount, 
nextRetryAt): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:602

Schedule the next retry attempt. The caller computes
`nextRetryAt` so the backoff schedule is centralized in the
consolidator.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `retryCount` | `number` |
| `nextRetryAt` | `number` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### upsertState()

```ts
upsertState(scope, patch): Promise<ConsolidatorStateRow>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:554

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `patch` | [`ConsolidatorStatePatch`](/api/@graphorin/memory/interfaces/ConsolidatorStatePatch.md) |

#### Returns

`Promise`\&lt;[`ConsolidatorStateRow`](/api/@graphorin/memory/interfaces/ConsolidatorStateRow.md)\&gt;
