[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SessionMemoryStoreExt

# Interface: SessionMemoryStoreExt

Defined in: [packages/memory/src/internal/storage-adapter.ts:218](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L218)

Extension of the typed `SessionMemoryStore` with optional
token-cache + vector-search + cursor-aware reader helpers that
storage adapters may expose.

## Stable

## Extends

- [`SessionMemoryStore`](/api/@graphorin/core/interfaces/SessionMemoryStore.md)

## Methods

### count()?

```ts
optional count(scope): Promise<number>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:247](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L247)

Count the live messages in the scoped session (CE-5) - a `COUNT(*)`, never
materialising rows; `0` for a user-only scope. Powers honest `metadata()`
counts instead of `list(...)`-materialising up to 1000 rows.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### list()

```ts
list(scope, opts?): Promise<readonly Message[]>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | [`SessionListOptions`](/api/@graphorin/core/interfaces/SessionListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]\&gt;

#### Inherited from

[`SessionMemoryStore`](/api/@graphorin/core/interfaces/SessionMemoryStore.md).[`list`](/api/@graphorin/core/interfaces/SessionMemoryStore.md#list)

***

### listMessagesSince()?

```ts
optional listMessagesSince(
   scope, 
   lastMessageId, 
limit): Promise<readonly SessionMessageRecord[]>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:237](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L237)

List messages for the supplied scope past the optional
`lastMessageId` cursor, oldest-first, capped at `limit`. Used by
the consolidator's standard phase to advance the per-scope
idempotency cursor without rereading already-processed turns.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `lastMessageId` | `string` \| `null` |
| `limit` | `number` |

#### Returns

`Promise`\&lt;readonly [`SessionMessageRecord`](/api/@graphorin/memory/interfaces/SessionMessageRecord.md)[]\&gt;

***

### listWithMetadata()?

```ts
optional listWithMetadata(scope, opts?): Promise<readonly SessionMessageWithMetadata[]>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

List messages with their persisted identity (RP-5). Optional: stores that
don't implement it fall back to `list` + fabricated ids on the export path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | [`SessionListOptions`](/api/@graphorin/core/interfaces/SessionListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`SessionMessageWithMetadata`](/api/@graphorin/core/interfaces/SessionMessageWithMetadata.md)[]\&gt;

#### Inherited from

[`SessionMemoryStore`](/api/@graphorin/core/interfaces/SessionMemoryStore.md).[`listWithMetadata`](/api/@graphorin/core/interfaces/SessionMemoryStore.md#listwithmetadata)

***

### push()

```ts
push(
   scope, 
   message, 
options?): Promise<MessageRef>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `message` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) |
| `options?` | [`SessionMessagePushOptions`](/api/@graphorin/core/interfaces/SessionMessagePushOptions.md) |

#### Returns

`Promise`\&lt;[`MessageRef`](/api/@graphorin/core/interfaces/MessageRef.md)\&gt;

#### Inherited from

[`SessionMemoryStore`](/api/@graphorin/core/interfaces/SessionMemoryStore.md).[`push`](/api/@graphorin/core/interfaces/SessionMemoryStore.md#push)

***

### search()

```ts
search(
   scope, 
   query, 
opts?): Promise<readonly MemoryHit<MemoryRecord>[]>;
```

Defined in: [packages/core/dist/contracts/memory-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/memory-store.d.ts)

Full-text search over the scoped session messages.

Query precedence (W-127): the POSITIONAL `query` parameter is
authoritative; when the caller also sets `opts.query` (the field
exists because [MemorySearchOptions](/api/@graphorin/core/interfaces/MemorySearchOptions.md) is shared with the
option-object search surfaces), implementations MUST ignore it.
The duplication is a known wart: narrowing `opts` to
`Omit<MemorySearchOptions, 'query'>` is a candidate for the next
major, not a change this line can make compatibly.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts?` | [`MemorySearchOptions`](/api/@graphorin/core/interfaces/MemorySearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)\&gt;[]\>

#### Inherited from

[`SessionMemoryStore`](/api/@graphorin/core/interfaces/SessionMemoryStore.md).[`search`](/api/@graphorin/core/interfaces/SessionMemoryStore.md#search)

***

### searchVector()?

```ts
optional searchVector(
   scope, 
   embedding, 
   embedderId, 
topK): Promise<readonly MemoryHit<MemoryRecord>[]>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:219](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L219)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `embedding` | `Float32Array` |
| `embedderId` | `string` |
| `topK` | `number` |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)\&gt;[]\>

***

### totalCachedTokens()?

```ts
optional totalCachedTokens(scope): Promise<number | null>;
```

Defined in: [packages/memory/src/internal/storage-adapter.ts:230](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L230)

Sum of `session_messages.token_count` for the supplied scope.
Returns `null` when the cache is empty / partially populated so
callers can fall back to a heuristic. Surfaced per DEC-131.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;`number` \| `null`\&gt;
