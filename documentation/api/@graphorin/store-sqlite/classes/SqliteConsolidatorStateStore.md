[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteConsolidatorStateStore

# Class: SqliteConsolidatorStateStore

Defined in: packages/store-sqlite/src/consolidator-store.ts:155

SQLite-backed consolidator state store. Constructed by
[SqliteMemoryStore](/api/@graphorin/store-sqlite/classes/SqliteMemoryStore.md); never instantiated directly by
application code.

## Stable

## Constructors

### Constructor

```ts
new SqliteConsolidatorStateStore(conn): SqliteConsolidatorStateStore;
```

Defined in: packages/store-sqlite/src/consolidator-store.ts:158

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:241

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:388

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:366

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:162

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:436

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:328

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:418

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:405

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:299

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:282

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:272

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:409

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

Defined in: packages/store-sqlite/src/consolidator-store.ts:173

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `patch` | [`ConsolidatorStatePatch`](/api/@graphorin/store-sqlite/interfaces/ConsolidatorStatePatch.md) |

#### Returns

`Promise`\&lt;[`ConsolidatorStateRow`](/api/@graphorin/store-sqlite/interfaces/ConsolidatorStateRow.md)\&gt;
