[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionMemoryStore

# Interface: SessionMemoryStore

Defined in: packages/core/src/contracts/memory-store.ts:133

**`Stable`**

## Extended by

- [`SessionMemoryStoreExt`](/api/@graphorin/memory/interfaces/SessionMemoryStoreExt.md)

## Methods

### list()

```ts
list(scope, opts?): Promise<readonly Message[]>;
```

Defined in: packages/core/src/contracts/memory-store.ts:139

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | [`SessionListOptions`](/api/@graphorin/core/interfaces/SessionListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]\&gt;

***

### listWithMetadata()?

```ts
optional listWithMetadata(scope, opts?): Promise<readonly SessionMessageWithMetadata[]>;
```

Defined in: packages/core/src/contracts/memory-store.ts:144

List messages with their persisted identity (RP-5). Optional: stores that
don't implement it fall back to `list` + fabricated ids on the export path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | [`SessionListOptions`](/api/@graphorin/core/interfaces/SessionListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`SessionMessageWithMetadata`](/api/@graphorin/core/interfaces/SessionMessageWithMetadata.md)[]\&gt;

***

### push()

```ts
push(
   scope, 
   message, 
options?): Promise<MessageRef>;
```

Defined in: packages/core/src/contracts/memory-store.ts:134

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `message` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) |
| `options?` | [`SessionMessagePushOptions`](/api/@graphorin/core/interfaces/SessionMessagePushOptions.md) |

#### Returns

`Promise`\&lt;[`MessageRef`](/api/@graphorin/core/interfaces/MessageRef.md)\&gt;

***

### search()

```ts
search(
   scope, 
   query, 
opts?): Promise<readonly MemoryHit<MemoryRecord>[]>;
```

Defined in: packages/core/src/contracts/memory-store.ts:159

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
