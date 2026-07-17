[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SuspendedRunStore

# Interface: SuspendedRunStore

Defined in: [packages/store-sqlite/src/suspended-run-store.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/suspended-run-store.ts#L29)

Durable sidecar for the server's `RunStateTracker`: a run suspended
on durable HITL outlives the process, so the REST resume endpoint
keeps working after a restart. The `@graphorin/server` package
consumes this surface; the schema ships in migration 038.

## Stable

## Methods

### delete()

```ts
delete(runId): Promise<void>;
```

Defined in: [packages/store-sqlite/src/suspended-run-store.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/suspended-run-store.ts#L37)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### get()

```ts
get(runId): Promise<
  | SuspendedRunRecord
| undefined>;
```

Defined in: [packages/store-sqlite/src/suspended-run-store.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/suspended-run-store.ts#L36)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`Promise`\<
  \| [`SuspendedRunRecord`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunRecord.md)
  \| `undefined`\>

***

### list()

```ts
list(): Promise<readonly SuspendedRunRecord[]>;
```

Defined in: [packages/store-sqlite/src/suspended-run-store.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/suspended-run-store.ts#L39)

Every parked run, oldest suspension first - boot hydration.

#### Returns

`Promise`\&lt;readonly [`SuspendedRunRecord`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunRecord.md)[]\&gt;

***

### put()

```ts
put(record): Promise<void>;
```

Defined in: [packages/store-sqlite/src/suspended-run-store.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/suspended-run-store.ts#L35)

Insert or refresh a suspension. A re-put for the same `runId`
replaces the state but keeps the original `suspendedAt`, so the
column always answers "how long has this approval been waiting".

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`SuspendedRunRecord`](/api/@graphorin/store-sqlite/interfaces/SuspendedRunRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
