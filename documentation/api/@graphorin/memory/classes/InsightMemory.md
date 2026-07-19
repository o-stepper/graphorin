[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / InsightMemory

# Class: InsightMemory

Defined in: packages/memory/src/tiers/insight-memory.ts:49

**`Stable`**

`InsightMemory` - list / search reflection insights. A no-op (returns
empty) when the storage adapter does not expose the optional
`insights` surface.

## Constructors

### Constructor

```ts
new InsightMemory(args): InsightMemory;
```

Defined in: packages/memory/src/tiers/insight-memory.ts:53

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `store`: [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md); `tracer`: [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md); \} |
| `args.store` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) |
| `args.tracer` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) |

#### Returns

`InsightMemory`

## Methods

### get()

```ts
get(id): Promise<Insight | null>;
```

Defined in: packages/memory/src/tiers/insight-memory.ts:118

Lookup a single insight by id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;[`Insight`](/api/@graphorin/core/interfaces/Insight.md) \| `null`\&gt;

***

### list()

```ts
list(scope, opts?): Promise<readonly Insight[]>;
```

Defined in: packages/memory/src/tiers/insight-memory.ts:99

Most-recent insights for the scope (newest first).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts` | [`InsightListOptions`](/api/@graphorin/memory/interfaces/InsightListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`Insight`](/api/@graphorin/core/interfaces/Insight.md)[]\&gt;

***

### search()

```ts
search(
   scope, 
   query, 
opts?): Promise<readonly MemoryHit<Insight>[]>;
```

Defined in: packages/memory/src/tiers/insight-memory.ts:59

FTS keyword search over insight text.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts` | [`InsightSearchOptions`](/api/@graphorin/memory/interfaces/InsightSearchOptions.md) |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Insight`](/api/@graphorin/core/interfaces/Insight.md)\&gt;[]\>

***

### validate()

```ts
validate(
   scope, 
   insightId, 
   reason?, 
options?): Promise<void>;
```

Defined in: packages/memory/src/tiers/insight-memory.ts:130

Promote a quarantined insight out of quarantine. Mirrors
[SemanticMemory.validate](/api/@graphorin/memory/classes/SemanticMemory.md#validate): re-derives the injection verdict from the
stored text and **refuses** promotion of an injection-flagged insight
unless an operator passes `{ force: true }` from a trusted context.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `insightId` | `string` |
| `reason?` | `string` |
| `options?` | \{ `force?`: `boolean`; \} |
| `options.force?` | `boolean` |

#### Returns

`Promise`\&lt;`void`\&gt;
