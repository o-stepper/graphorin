[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteConsolidatorStateStore

# Class: SqliteConsolidatorStateStore

Defined in: [packages/store-sqlite/src/consolidator-store.ts:155](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L155)

SQLite-backed consolidator state store. Constructed by
[SqliteMemoryStore](/api/@graphorin/store-sqlite/classes/SqliteMemoryStore.md); never instantiated directly by
application code.

## Stable

## Constructors

### Constructor

```ts
new SqliteConsolidatorStateStore(conn): SqliteConsolidatorStateStore;
```

Defined in: [packages/store-sqlite/src/consolidator-store.ts:158](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L158)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqliteConsolidatorStateStore`

## Methods

### acquireLock()

```ts
acquireLock(
   scope, 
   runId, 
   now, 
maxAgeMs): Promise<boolean>;
```

Defined in: [packages/store-sqlite/src/consolidator-store.ts:235](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L235)

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

Defined in: [packages/store-sqlite/src/consolidator-store.ts:394](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L394)

W-133: despite the name, this is a plain SELECT of due DLQ batches
WITHOUT any lease/claim semantics - two concurrent callers see the
same rows. Serializing concurrent drains is the CALLER's job via
the CS-8 consolidator scope lock (the runtime always drains under
it); the worst case of a bypassed lock is duplicated LLM replay
spend, not corruption. The name is kept because the method sits on
the stable contract surface - renaming would be a breaking change
with no behavioural gain.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | `undefined` |
| `now` | `number` | `undefined` |
| `limit` | `number` | `50` |

#### Returns

`Promise`\&lt;readonly [`DlqBatchRow`](/api/@graphorin/store-sqlite/interfaces/DlqBatchRow.md)[]\&gt;

***

### enqueueFailedBatch()

```ts
enqueueFailedBatch(input): Promise<void>;
```

Defined in: [packages/store-sqlite/src/consolidator-store.ts:362](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L362)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`DlqBatchInput`](/api/@graphorin/store-sqlite/interfaces/DlqBatchInput.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### getState()

```ts
getState(scope): Promise<
  | ConsolidatorStateRow
| null>;
```

Defined in: [packages/store-sqlite/src/consolidator-store.ts:162](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L162)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\<
  \| [`ConsolidatorStateRow`](/api/@graphorin/store-sqlite/interfaces/ConsolidatorStateRow.md)
  \| `null`\>

***

### listFailedBatches()

```ts
listFailedBatches(scope, limit?): Promise<readonly DlqBatchRow[]>;
```

Defined in: [packages/store-sqlite/src/consolidator-store.ts:474](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L474)

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | `undefined` |
| `limit` | `number` | `100` |

#### Returns

`Promise`\&lt;readonly [`DlqBatchRow`](/api/@graphorin/store-sqlite/interfaces/DlqBatchRow.md)[]\&gt;

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

Defined in: [packages/store-sqlite/src/consolidator-store.ts:324](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L324)

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | `undefined` |
| `limit` | `number` | `50` |

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

Defined in: [packages/store-sqlite/src/consolidator-store.ts:424](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L424)

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

Defined in: [packages/store-sqlite/src/consolidator-store.ts:411](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L411)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### pruneExhaustedBatches()

```ts
pruneExhaustedBatches(beforeEpochMs): Promise<number>;
```

Defined in: [packages/store-sqlite/src/consolidator-store.ts:466](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L466)

W-065: retention for the dead-letter queue. Deletes only EXHAUSTED
batches (`next_retry_at IS NULL` - parked forever by
`markBatchExhausted`) that failed before the cutoff; batches still
awaiting a retry are never touched (they belong to
`claimReadyBatches`). Returns rows deleted.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `beforeEpochMs` | `number` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Stable

***

### pruneRuns()

```ts
pruneRuns(beforeEpochMs): Promise<number>;
```

Defined in: [packages/store-sqlite/src/consolidator-store.ts:449](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L449)

W-065: retention for the per-tick run log. Deletes terminal runs
that started before the cutoff; in-flight rows
(`status = 'running'`) always survive. Returns rows deleted.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `beforeEpochMs` | `number` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Stable

***

### recordRunFinish()

```ts
recordRunFinish(finish): Promise<void>;
```

Defined in: [packages/store-sqlite/src/consolidator-store.ts:295](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L295)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `finish` | [`ConsolidatorRunFinish`](/api/@graphorin/store-sqlite/interfaces/ConsolidatorRunFinish.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### recordRunStart()

```ts
recordRunStart(input): Promise<void>;
```

Defined in: [packages/store-sqlite/src/consolidator-store.ts:278](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L278)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ConsolidatorRunInput`](/api/@graphorin/store-sqlite/interfaces/ConsolidatorRunInput.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### releaseLock()

```ts
releaseLock(scope, runId): Promise<void>;
```

Defined in: [packages/store-sqlite/src/consolidator-store.ts:266](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L266)

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

Defined in: [packages/store-sqlite/src/consolidator-store.ts:415](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L415)

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

Defined in: [packages/store-sqlite/src/consolidator-store.ts:173](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L173)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `patch` | [`ConsolidatorStatePatch`](/api/@graphorin/store-sqlite/interfaces/ConsolidatorStatePatch.md) |

#### Returns

`Promise`\&lt;[`ConsolidatorStateRow`](/api/@graphorin/store-sqlite/interfaces/ConsolidatorStateRow.md)\&gt;
