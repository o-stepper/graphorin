[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / SuspendedRunPersistenceStore

# Interface: SuspendedRunPersistenceStore

Defined in: packages/server/src/runtime/suspended-run-persistence.ts:27

**`Stable`**

Structural slice of `@graphorin/store-sqlite`'s `SuspendedRunStore`
the delegate needs (kept local so tests wire plain objects).

## Methods

### delete()

```ts
delete(runId): Promise<void>;
```

Defined in: packages/server/src/runtime/suspended-run-persistence.ts:36

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### put()

```ts
put(record): Promise<void>;
```

Defined in: packages/server/src/runtime/suspended-run-persistence.ts:28

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | \{ `agentId`: `string`; `runId`: `string`; `sessionId?`: `string`; `stateJson`: `string`; `suspendedAt`: `number`; `userId?`: `string`; \} |
| `record.agentId` | `string` |
| `record.runId` | `string` |
| `record.sessionId?` | `string` |
| `record.stateJson` | `string` |
| `record.suspendedAt` | `number` |
| `record.userId?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
