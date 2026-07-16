[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictMemoryStoreExt

# Interface: ConflictMemoryStoreExt

Defined in: [packages/memory/src/internal/storage-adapter.ts:409](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L409)

Optional storage extension surfacing the audit + pending queue
tables Phase 10b owns. Adapters that opt out leave the property
undefined; the conflict pipeline degrades gracefully (no audit, no
deferred queue, but every other stage still functions).

## Stable

## Methods

### enqueuePending()

```ts
enqueuePending(input): Promise<{
  id: number;
}>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:414](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L414)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`PendingConflictInputLike`](/api/@graphorin/memory/interfaces/PendingConflictInputLike.md) |

#### Returns

`Promise`\<\{
  `id`: `number`;
\}\>

***

### listPending()

```ts
listPending(scope, limit?): Promise<readonly PendingConflictRowLike[]>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:415](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L415)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `limit?` | `number` |

#### Returns

`Promise`\&lt;readonly [`PendingConflictRowLike`](/api/@graphorin/memory/interfaces/PendingConflictRowLike.md)[]\&gt;

***

### markAttempted()?

```ts
optional markAttempted(id, attemptedAt?): Promise<void>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:423](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L423)

Stamp `attemptedAt` on a pending row whose judge call failed
(MCON-9). The deep phase closes the row as `'judge-unparseable'`
on the NEXT failure, so a poisoned row is billed at most twice.
Optional - without it the deep phase falls back to skip-and-retry.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `number` |
| `attemptedAt?` | `number` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### markResolved()

```ts
markResolved(id, decision): Promise<void>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:416](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L416)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `number` |
| `decision` | [`ConflictAuditDecision`](/api/@graphorin/memory/type-aliases/ConflictAuditDecision.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### recordDecision()

```ts
recordDecision(input): Promise<{
  detectedAt: number;
  id: number;
}>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:410](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L410)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ConflictAuditInputLike`](/api/@graphorin/memory/interfaces/ConflictAuditInputLike.md) |

#### Returns

`Promise`\<\{
  `detectedAt`: `number`;
  `id`: `number`;
\}\>
