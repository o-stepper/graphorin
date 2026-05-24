[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SessionMemory

# Class: SessionMemory

Defined in: packages/memory/src/tiers/session-memory.ts:48

`SessionMemory` — append-only message log per session. Owns the
`session_messages` storage by single-source-of-truth (DEC-147); the
`@graphorin/sessions` package wraps this surface in Phase 11.

## Stable

## Constructors

### Constructor

```ts
new SessionMemory(args): SessionMemory;
```

Defined in: packages/memory/src/tiers/session-memory.ts:53

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

Defined in: packages/memory/src/tiers/session-memory.ts:226

Returns the registered agents that participated in the supplied
scope. The default sqlite adapter exposes `agents_registry` rows
via the sessions store; this convenience accessor resolves them
without requiring callers to import the sessions package.

The method is best-effort — adapters that do not maintain an
agent registry simply return an empty list.

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

Defined in: packages/memory/src/tiers/session-memory.ts:153

Phase 10a ships the deterministic minimum-viable compaction:
summarises the request as a counter-only shape. Phase 10c
replaces the inner body with the LLM-summarized cutoff.

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

Defined in: packages/memory/src/tiers/session-memory.ts:134

Surface high-importance items as a silent turn for the model.
Phase 10a ships a no-op shell; Phase 10c (Consolidator) populates
the actual flush behaviour. The method exists in 10a so callers
can wire the contract today without conditional checks.

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

Defined in: packages/memory/src/tiers/session-memory.ts:87

List messages for the supplied scope.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | [`SessionListOptions`](/api/@graphorin/core/interfaces/SessionListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]\&gt;

***

### push()

```ts
push(scope, message): Promise<MessageRef>;
```

Defined in: packages/memory/src/tiers/session-memory.ts:64

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

Defined in: packages/memory/src/tiers/session-memory.ts:106

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

Defined in: packages/memory/src/tiers/session-memory.ts:192

Returns `true` when the cached message tokens exceed
`compactAtRatio * contextWindow` (default `0.9` per DEC-104). The
second argument can be either:

 - a `number` — interpreted as the live `contextWindow` size in
   tokens (matches the documented memory-system spec signature);
 - an options bag — `{ usedTokens?, contextWindow? }`. When
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
