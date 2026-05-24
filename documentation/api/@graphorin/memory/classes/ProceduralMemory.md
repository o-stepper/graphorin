[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ProceduralMemory

# Class: ProceduralMemory

Defined in: packages/memory/src/tiers/procedural-memory.ts:45

`ProceduralMemory` — standing orders activated when the agent's
current context matches the rule's predicate. The activation rules
are deterministic so the agent runtime + ContextEngine can render
the active set into the system prompt every step.

## Stable

## Constructors

### Constructor

```ts
new ProceduralMemory(args): ProceduralMemory;
```

Defined in: packages/memory/src/tiers/procedural-memory.ts:49

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `store`: [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md); `tracer`: [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md); \} |
| `args.store` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) |
| `args.tracer` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) |

#### Returns

`ProceduralMemory`

## Methods

### activate()

```ts
activate(scope, context?): Promise<readonly Rule[]>;
```

Defined in: packages/memory/src/tiers/procedural-memory.ts:110

Return the rules active under `context`. Rules without a
`condition` are always active; the bundled predicate vocabulary
supports the literals `'always'`, `'topic=<topic>'`, and
`'tag=<tag>'`. Anything outside that grammar is treated as
always-active so callers do not silently lose rules.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `context` | [`RuleActivationContext`](/api/@graphorin/memory/interfaces/RuleActivationContext.md) |

#### Returns

`Promise`\&lt;readonly [`Rule`](/api/@graphorin/core/interfaces/Rule.md)[]\&gt;

***

### define()

```ts
define(scope, input): Promise<Rule>;
```

Defined in: packages/memory/src/tiers/procedural-memory.ts:55

Persist a rule. Returns the stored record.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `input` | [`RuleInput`](/api/@graphorin/memory/interfaces/RuleInput.md) |

#### Returns

`Promise`\&lt;[`Rule`](/api/@graphorin/core/interfaces/Rule.md)\&gt;

***

### list()

```ts
list(scope): Promise<readonly Rule[]>;
```

Defined in: packages/memory/src/tiers/procedural-memory.ts:95

List every active (non-deleted) rule for the supplied scope.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;readonly [`Rule`](/api/@graphorin/core/interfaces/Rule.md)[]\&gt;

***

### remove()

```ts
remove(
   scope, 
   ruleId, 
reason?): Promise<void>;
```

Defined in: packages/memory/src/tiers/procedural-memory.ts:82

Soft-delete a rule.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `ruleId` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
