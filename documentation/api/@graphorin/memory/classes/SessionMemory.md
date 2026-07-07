[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SessionMemory

# Class: SessionMemory

Defined in: [packages/memory/src/tiers/session-memory.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L50)

`SessionMemory` - append-only message log per session. Owns the
`session_messages` storage by single-source-of-truth (DEC-147); the
`@graphorin/sessions` package wraps this surface in Phase 11.

## Stable

## Constructors

### Constructor

```ts
new SessionMemory(args): SessionMemory;
```

Defined in: [packages/memory/src/tiers/session-memory.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L55)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `compactionPolicy?`: [`SessionCompactionPolicy`](/api/@graphorin/memory/interfaces/SessionCompactionPolicy.md); `store`: [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md); `tracer`: [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md); \} |
| `args.compactionPolicy?` | [`SessionCompactionPolicy`](/api/@graphorin/memory/interfaces/SessionCompactionPolicy.md) |
| `args.store` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) |
| `args.tracer` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) |

#### Returns

`SessionMemory`

## Methods

### attributedFor()

```ts
attributedFor(scope): Promise<readonly AgentRegistryEntry[]>;
```

Defined in: [packages/memory/src/tiers/session-memory.ts:253](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L253)

NOT IMPLEMENTED (MRET-12) - always resolves `[]`. The agent
registry lives in `@graphorin/sessions` and has never been
threaded into this tier; the previous JSDoc claimed the default
sqlite adapter "resolves" registry rows here, which was false. Use
the sessions facade for participant attribution.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;readonly [`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md)[]\&gt;

***

### compact()

```ts
compact(scope, opts?): Promise<SessionCompactionResult>;
```

Defined in: [packages/memory/src/tiers/session-memory.ts:185](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L185)

NOT IMPLEMENTED (MRET-12) - always resolves
`{ removed: 0, summarized: 0 }` and deletes / summarizes nothing.
Session-context compaction is owned by the context engine
(`memory.contextEngine.compactNow`, driven by the agent runtime);
this tier-level method previously FABRICATED counts (it reported
`total - keepLastN` as "removed" while removing nothing - with the
default `keepLastN: 0` it claimed to have compacted the whole
session). It now reports the truth until a real message splice
exists at this layer.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | \{ `keepLastN?`: `number`; \} |
| `opts.keepLastN?` | `number` |

#### Returns

`Promise`\&lt;[`SessionCompactionResult`](/api/@graphorin/memory/interfaces/SessionCompactionResult.md)\&gt;

***

### flushImportant()

```ts
flushImportant(scope, opts?): Promise<{
  flushed: number;
}>;
```

Defined in: [packages/memory/src/tiers/session-memory.ts:160](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L160)

NOT IMPLEMENTED (MRET-12) - always resolves `{ flushed: 0 }` and
performs no work. The consolidator pipeline (extraction → facts /
episodes) superseded the planned "silent flush turn"; this method
remains only for contract stability. Do not branch on its counter.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | \{ `silent?`: `boolean`; \} |
| `opts.silent?` | `boolean` |

#### Returns

`Promise`\<\{
  `flushed`: `number`;
\}\>

***

### list()

```ts
list(scope, opts?): Promise<readonly Message[]>;
```

Defined in: [packages/memory/src/tiers/session-memory.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L89)

List messages for the supplied scope.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | [`SessionListOptions`](/api/@graphorin/core/interfaces/SessionListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]\&gt;

***

### listWithMetadata()

```ts
listWithMetadata(scope, opts?): Promise<readonly SessionMessageWithMetadata[]>;
```

Defined in: [packages/memory/src/tiers/session-memory.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L112)

RP-5: list messages with their persisted identity (stored id / sequence /
`createdAt`) so an exporter preserves message identity + chronology.
Delegates to the store when it supports the richer read.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | [`SessionListOptions`](/api/@graphorin/core/interfaces/SessionListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`SessionMessageWithMetadata`](/api/@graphorin/core/interfaces/SessionMessageWithMetadata.md)[]\&gt;

***

### push()

```ts
push(scope, message): Promise<MessageRef>;
```

Defined in: [packages/memory/src/tiers/session-memory.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L66)

Persist a message. Returns the storage reference.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `message` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) |

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

Defined in: [packages/memory/src/tiers/session-memory.ts:132](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L132)

Hybrid (FTS5) search over the session messages.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts` | \{ `signal?`: `AbortSignal`; `topK?`: `number`; \} |
| `opts.signal?` | `AbortSignal` |
| `opts.topK?` | `number` |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)\&gt;[]\>

***

### shouldCompact()

```ts
shouldCompact(scope, contextWindowOrOptions?): Promise<boolean>;
```

Defined in: [packages/memory/src/tiers/session-memory.ts:221](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L221)

Returns `true` when the cached message tokens exceed
`compactAtRatio * contextWindow` (default `0.9` per DEC-104). The
second argument can be either:

 - a `number` - interpreted as the live `contextWindow` size in
   tokens (matches the documented memory-system spec signature);
 - an options bag - `{ usedTokens?, contextWindow? }`. When
   `usedTokens` is supplied the call is purely arithmetic; when
   omitted, the storage adapter's per-message `token_count`
   cache (DEC-131) is consulted via `totalCachedTokens(scope)`,
   falling back to a heuristic (~4 chars/token) for cache
   misses.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `contextWindowOrOptions` | \| `number` \| \{ `contextWindow?`: `number`; `usedTokens?`: `number`; \} |

#### Returns

`Promise`\&lt;`boolean`\&gt;

#### Stable
