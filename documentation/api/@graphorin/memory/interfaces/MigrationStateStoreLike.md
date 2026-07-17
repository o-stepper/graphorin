[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MigrationStateStoreLike

# Interface: MigrationStateStoreLike

Defined in: [packages/memory/src/migration/embedder-migration.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L60)

Structural view of the persisted `migration_state` cursor store
(wave-D D5 / MST-12). The default implementation is
`@graphorin/store-sqlite`'s `store.embedderMigration.state`; declared
structurally here so this package never imports the storage package.

## Stable

## Methods

### create()

```ts
create(state): Promise<void>;
```

Defined in: [packages/memory/src/migration/embedder-migration.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L69)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | \{ `id`: `string`; `sourceEmbedder`: `string`; `strategy`: `string`; `targetEmbedder`: `string`; `totalRecords`: `number`; \} |
| `state.id` | `string` |
| `state.sourceEmbedder` | `string` |
| `state.strategy` | `string` |
| `state.targetEmbedder` | `string` |
| `state.totalRecords` | `number` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### findResumable()

```ts
findResumable(sourceEmbedder, targetEmbedder): Promise<
  | {
  id: string;
  lastRecordId: string | null;
  processed: number;
}
| null>;
```

Defined in: [packages/memory/src/migration/embedder-migration.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L61)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceEmbedder` | `string` |
| `targetEmbedder` | `string` |

#### Returns

`Promise`\<
  \| \{
  `id`: `string`;
  `lastRecordId`: `string` \| `null`;
  `processed`: `number`;
\}
  \| `null`\>

***

### update()

```ts
update(id, patch): Promise<void>;
```

Defined in: [packages/memory/src/migration/embedder-migration.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L76)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `patch` | \{ `errorMessage?`: `string` \| `null`; `lastRecordId?`: `string` \| `null`; `processed?`: `number`; `status?`: `"failed"` \| `"aborted"` \| `"running"` \| `"committed"`; \} |
| `patch.errorMessage?` | `string` \| `null` |
| `patch.lastRecordId?` | `string` \| `null` |
| `patch.processed?` | `number` |
| `patch.status?` | `"failed"` \| `"aborted"` \| `"running"` \| `"committed"` |

#### Returns

`Promise`\&lt;`void`\&gt;
