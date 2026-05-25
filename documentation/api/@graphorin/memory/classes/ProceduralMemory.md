[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ProceduralMemory

# Class: ProceduralMemory

Defined in: packages/memory/src/tiers/procedural-memory.ts:93

`ProceduralMemory` — standing orders activated when the agent's
current context matches the rule's predicate. The activation rules
are deterministic so the agent runtime + ContextEngine can render
the active set into the system prompt every step.

P2-2 adds [ProceduralMemory.induce](/api/@graphorin/memory/classes/ProceduralMemory.md#induce): distil a reusable workflow
from a successful agent trajectory and store it **quarantined** (it must
not drive actions until validated). Quarantined procedures are excluded
from [ProceduralMemory.activate](/api/@graphorin/memory/classes/ProceduralMemory.md#activate) but remain visible to
[ProceduralMemory.list](/api/@graphorin/memory/classes/ProceduralMemory.md#list).

## Stable

## Constructors

### Constructor

```ts
new ProceduralMemory(args): ProceduralMemory;
```

Defined in: packages/memory/src/tiers/procedural-memory.ts:99

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `inducer?`: \| [`WorkflowInducer`](/api/@graphorin/memory/interfaces/WorkflowInducer.md) \| `null`; `store`: [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md); `tracer`: [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md); \} |
| `args.inducer?` | \| [`WorkflowInducer`](/api/@graphorin/memory/interfaces/WorkflowInducer.md) \| `null` |
| `args.store` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) |
| `args.tracer` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) |

#### Returns

`ProceduralMemory`

## Methods

### activate()

```ts
activate(scope, context?): Promise<readonly Rule[]>;
```

Defined in: packages/memory/src/tiers/procedural-memory.ts:249

Return the rules active under `context`. Rules without a
`condition` are always active; the bundled predicate vocabulary
supports the literals `'always'`, `'topic=<topic>'`, and
`'tag=<tag>'`. Anything outside that grammar is treated as
always-active so callers do not silently lose rules.

**Quarantined procedures are excluded** (P1-4 / P2-2): an induced
procedure must not drive actions until validated, so activation — which
feeds the system prompt — never surfaces it.

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

Defined in: packages/memory/src/tiers/procedural-memory.ts:110

Persist a rule. Returns the stored record.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `input` | [`RuleInput`](/api/@graphorin/memory/interfaces/RuleInput.md) |

#### Returns

`Promise`\&lt;[`Rule`](/api/@graphorin/core/interfaces/Rule.md)\&gt;

***

### induce()

```ts
induce(
   scope, 
   trajectory, 
opts?): Promise<Rule | null>;
```

Defined in: packages/memory/src/tiers/procedural-memory.ts:152

Induce a reusable procedure (P2-2) from a successful agent trajectory
and store it **quarantined** + `provenance: 'induction'` (P1-4). Returns
the stored [Rule](/api/@graphorin/core/interfaces/Rule.md), or `null` when the trajectory was unsuccessful /
empty or the inducer produced nothing inducible.

Throws [ProcedureInductionNotConfiguredError](/api/@graphorin/memory/errors/classes/ProcedureInductionNotConfiguredError.md) when no inducer was
configured (`createMemory({ procedureInduction: { provider } })`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `trajectory` | [`Trajectory`](/api/@graphorin/memory/interfaces/Trajectory.md) |
| `opts` | [`InduceOptions`](/api/@graphorin/memory/interfaces/InduceOptions.md) |

#### Returns

`Promise`\&lt;[`Rule`](/api/@graphorin/core/interfaces/Rule.md) \| `null`\&gt;

***

### induceFromRun()

```ts
induceFromRun(
   scope, 
   run, 
opts?): Promise<Rule | null>;
```

Defined in: packages/memory/src/tiers/procedural-memory.ts:208

Convenience over [induce](/api/@graphorin/memory/classes/ProceduralMemory.md#induce): distil the [Trajectory](/api/@graphorin/memory/interfaces/Trajectory.md) from a
completed [RunState](/api/@graphorin/core/interfaces/RunState.md) (the agent's already-emitted run state) and
induce a procedure. The success signal is `status === 'completed'`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `run` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) |
| `opts` | [`InduceOptions`](/api/@graphorin/memory/interfaces/InduceOptions.md) |

#### Returns

`Promise`\&lt;[`Rule`](/api/@graphorin/core/interfaces/Rule.md) \| `null`\&gt;

***

### list()

```ts
list(scope): Promise<readonly Rule[]>;
```

Defined in: packages/memory/src/tiers/procedural-memory.ts:230

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

Defined in: packages/memory/src/tiers/procedural-memory.ts:217

Soft-delete a rule.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `ruleId` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
