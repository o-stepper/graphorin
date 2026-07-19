[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / WorkingMemory

# Class: WorkingMemory

Defined in: packages/memory/src/tiers/working-memory.ts:105

**`Stable`**

`WorkingMemory` - labeled, character-bounded blocks rendered into
every system prompt. Operations:

 - `define(spec)`: idempotently registers a block definition; the
   block's row is created in storage on the next `write` call so
   operators can change `description` between runs without
   triggering a write.
 - `read(scope, label)` / `list(scope)`: surface the current block
   contents.
 - `write(scope, label, value)`: full replace.
 - `append(scope, label, content)`: append-with-newline.
 - `replace(scope, label, oldUnique, newText)`: targeted replace
   with a uniqueness check.
 - `compile(scope)`: render the active blocks for the context
   engine (used by Phase 10d).

## Constructors

### Constructor

```ts
new WorkingMemory(args): WorkingMemory;
```

Defined in: packages/memory/src/tiers/working-memory.ts:110

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `store`: [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md); `tracer`: [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md); \} |
| `args.store` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) |
| `args.tracer` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) |

#### Returns

`WorkingMemory`

## Methods

### append()

```ts
append(
   scope, 
   label, 
content): Promise<Block>;
```

Defined in: packages/memory/src/tiers/working-memory.ts:167

Append `content` to a block (with a newline separator).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |
| `content` | `string` |

#### Returns

`Promise`\&lt;[`Block`](/api/@graphorin/core/interfaces/Block.md)\&gt;

***

### attach()

```ts
attach(
   scope, 
   blockId, 
agentId): Promise<void>;
```

Defined in: packages/memory/src/tiers/working-memory.ts:251

Attach a working block to an additional agent. Backed by the
adapter's `shared.attach(...)` join table so multi-agent crews
can share the same block without duplicating storage.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `blockId` | `string` |
| `agentId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### compile()

```ts
compile(scope, agentId?): Promise<string>;
```

Defined in: packages/memory/src/tiers/working-memory.ts:294

Render a deterministic `<memory_blocks>` XML fragment for the
supplied scope. The full layered system prompt (six layers) is
produced by Phase 10d's ContextEngine; this method ships the
minimum-viable rendering used by the smoke acceptance criteria.

The optional `agentId` argument is reserved for the per-agent
filtering Phase 10d wires through. In Phase 10a the argument is
accepted but ignored - the rendering is scope-wide.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `agentId?` | `string` |

#### Returns

`Promise`\&lt;`string`\&gt;

***

### define()

```ts
define(definition): BlockDefinition;
```

Defined in: packages/memory/src/tiers/working-memory.ts:117

Register a block definition. Returns the same definition object.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `definition` | [`BlockDefinition`](/api/@graphorin/memory/interfaces/BlockDefinition.md) |

#### Returns

[`BlockDefinition`](/api/@graphorin/memory/interfaces/BlockDefinition.md)

***

### definitionFor()

```ts
definitionFor(label): 
  | BlockDefinition
  | undefined;
```

Defined in: packages/memory/src/tiers/working-memory.ts:128

Lookup a definition by label.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `label` | `string` |

#### Returns

  \| [`BlockDefinition`](/api/@graphorin/memory/interfaces/BlockDefinition.md)
  \| `undefined`

***

### definitions()

```ts
definitions(): readonly BlockDefinition[];
```

Defined in: packages/memory/src/tiers/working-memory.ts:123

Snapshot of every registered definition.

#### Returns

readonly [`BlockDefinition`](/api/@graphorin/memory/interfaces/BlockDefinition.md)[]

***

### detach()

```ts
detach(
   scope, 
   blockId, 
agentId): Promise<void>;
```

Defined in: packages/memory/src/tiers/working-memory.ts:268

Detach a working block from an agent.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `blockId` | `string` |
| `agentId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### forget()

```ts
forget(
   scope, 
   label, 
reason?): Promise<void>;
```

Defined in: packages/memory/src/tiers/working-memory.ts:205

Soft-delete a block.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### list()

```ts
list(scope): Promise<readonly Block[]>;
```

Defined in: packages/memory/src/tiers/working-memory.ts:133

List active (non-deleted) blocks for the supplied scope.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;readonly [`Block`](/api/@graphorin/core/interfaces/Block.md)[]\&gt;

***

### purge()

```ts
purge(scope, label): Promise<void>;
```

Defined in: packages/memory/src/tiers/working-memory.ts:227

Hard-delete a block (GDPR path). Unlike [forget](/api/@graphorin/memory/classes/WorkingMemory.md#forget)
(soft tombstone), the stored value is gone. This is the erasure
surface for USER-scoped blocks (e.g. the `profile` projection): the
session-delete cascade never reaches rows without a session id, so
user-level erasure must call this explicitly. Throws when the
storage adapter does not implement the optional
`WorkingMemoryStoreExt.purge` - a silent soft-delete fallback would
misreport erasure.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### read()

```ts
read(scope, label): Promise<string | null>;
```

Defined in: packages/memory/src/tiers/working-memory.ts:142

Read a single block's value (or `null` when absent).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |

#### Returns

`Promise`\&lt;`string` \| `null`\&gt;

***

### replace()

```ts
replace(
   scope, 
   label, 
   oldUnique, 
newText): Promise<Block>;
```

Defined in: packages/memory/src/tiers/working-memory.ts:179

Replace the unique substring `oldUnique` inside the block's value
with `newText`. Throws `WorkingBlockReplaceMismatchError` when
the substring is missing or appears more than once.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |
| `oldUnique` | `string` |
| `newText` | `string` |

#### Returns

`Promise`\&lt;[`Block`](/api/@graphorin/core/interfaces/Block.md)\&gt;

***

### rethink()

```ts
rethink(
   scope, 
   label, 
mutator): Promise<Block>;
```

Defined in: packages/memory/src/tiers/working-memory.ts:196

Run `mutator(current) => next` and persist the result.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |
| `mutator` | (`current`) => `string` \| `Promise`\&lt;`string`\&gt; |

#### Returns

`Promise`\&lt;[`Block`](/api/@graphorin/core/interfaces/Block.md)\&gt;

***

### write()

```ts
write(
   scope, 
   label, 
value): Promise<Block>;
```

Defined in: packages/memory/src/tiers/working-memory.ts:162

Replace a block's value entirely. Honours overflow policy.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `label` | `string` |
| `value` | `string` |

#### Returns

`Promise`\&lt;[`Block`](/api/@graphorin/core/interfaces/Block.md)\&gt;
