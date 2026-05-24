[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DecayMemoryStoreExt

# Interface: DecayMemoryStoreExt

Defined in: packages/memory/src/internal/storage-adapter.ts:429

Decay-aware extension of the typed `SemanticMemoryStore`. Phase
10c's light phase reads the strength + last-accessed columns and
archives facts whose retention curve falls below the configured
threshold. Adapters that do not maintain decay columns may omit
the surface entirely — the light phase skips the archive step
with an INFO log.

## Stable

## Methods

### archiveFact()

```ts
archiveFact(id, reason?): Promise<void>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:452

Soft-archive a fact (sets `archived = 1`). The audit row in
`memory_history` records the archive event.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### listForDecay()

```ts
listForDecay(scope, limit?): Promise<readonly {
  archived: boolean;
  createdAt: number;
  id: string;
  lastAccessedAt: number | null;
  strength: number;
  text: string;
}[]>;
```

Defined in: packages/memory/src/internal/storage-adapter.ts:435

List facts for the scope ordered by `lastAccessedAt` ASC so the
caller can apply Ebbinghaus retention without scanning the
whole table. `limit` defaults to `1000`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `limit?` | `number` |

#### Returns

`Promise`\<readonly \{
  `archived`: `boolean`;
  `createdAt`: `number`;
  `id`: `string`;
  `lastAccessedAt`: `number` \| `null`;
  `strength`: `number`;
  `text`: `string`;
\}[]\>
