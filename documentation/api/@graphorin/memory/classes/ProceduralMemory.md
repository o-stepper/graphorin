[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ProceduralMemory

# Class: ProceduralMemory

Defined in: [packages/memory/src/tiers/procedural-memory.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L101)

`ProceduralMemory` - standing orders activated when the agent's
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

Defined in: [packages/memory/src/tiers/procedural-memory.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L112)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `inducer?`: \| [`WorkflowInducer`](/api/@graphorin/memory/interfaces/WorkflowInducer.md) \| `null`; `promoteAfterSuccesses?`: `number` \| `null`; `store`: [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md); `tracer`: [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md); \} |
| `args.inducer?` | \| [`WorkflowInducer`](/api/@graphorin/memory/interfaces/WorkflowInducer.md) \| `null` |
| `args.promoteAfterSuccesses?` | `number` \| `null` |
| `args.store` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) |
| `args.tracer` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) |

#### Returns

`ProceduralMemory`

## Methods

### activate()

```ts
activate(scope, context?): Promise<readonly Rule[]>;
```

Defined in: [packages/memory/src/tiers/procedural-memory.ts:334](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L334)

Return the rules active under `context`. Rules without a
`condition` are always active; the bundled predicate vocabulary
supports the literals `'always'`, `'topic=<topic>'`, and
`'tag=<tag>'`. Anything outside that grammar is treated as
always-active so callers do not silently lose rules.

**Quarantined procedures are excluded** (P1-4 / P2-2): an induced
procedure must not drive actions until validated, so activation - which
feeds the system prompt - never surfaces it.

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

Defined in: [packages/memory/src/tiers/procedural-memory.ts:192](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L192)

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

Defined in: [packages/memory/src/tiers/procedural-memory.ts:235](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L235)

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

Defined in: [packages/memory/src/tiers/procedural-memory.ts:293](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L293)

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

Defined in: [packages/memory/src/tiers/procedural-memory.ts:315](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L315)

List every active (non-deleted) rule for the supplied scope.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;readonly [`Rule`](/api/@graphorin/core/interfaces/Rule.md)[]\&gt;

***

### recordOutcome()

```ts
recordOutcome(
   scope, 
   ruleId, 
   succeeded): Promise<{
  promoted: boolean;
  refused: boolean;
  successCount: number;
}>;
```

Defined in: [packages/memory/src/tiers/procedural-memory.ts:142](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L142)

Record the outcome of one demonstrated reuse of a procedure
(MCON-2 part 4). A success increments the rule's persistent
`successCount`; when `procedurePromotion.afterSuccesses` is
configured and a QUARANTINED procedure reaches the threshold it is
promoted through [validate](/api/@graphorin/memory/classes/ProceduralMemory.md#validate) - the injection gate still
applies, so a flagged text refuses promotion (surfaced as
`refused: true`) no matter how many successes accumulate.
Failures are observed but not persisted (no negative counter yet).

Callers decide what "success" means - typically
`checkSuccessCriteria(...)` over the procedure's stored
`successCriteria`, or an operator's judgement.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `ruleId` | `string` |
| `succeeded` | `boolean` |

#### Returns

`Promise`\<\{
  `promoted`: `boolean`;
  `refused`: `boolean`;
  `successCount`: `number`;
\}\>

#### Stable

***

### remove()

```ts
remove(
   scope, 
   ruleId, 
reason?): Promise<void>;
```

Defined in: [packages/memory/src/tiers/procedural-memory.ts:302](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L302)

Soft-delete a rule.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `ruleId` | `string` |
| `reason?` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### search()

```ts
search(
   scope, 
   query, 
opts?): Promise<readonly MemoryHit<Rule>[]>;
```

Defined in: [packages/memory/src/tiers/procedural-memory.ts:360](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L360)

Runbook content search (D3): "find the procedure for this task" -
lexical recall over rule text, as opposed to predicate
[activate](/api/@graphorin/memory/classes/ProceduralMemory.md#activate). Returns **whole validated procedures** (the full
[Rule](/api/@graphorin/core/interfaces/Rule.md) incl. steps / variables / success criteria) so a match
can be followed file-style rather than re-synthesized from
fragments. Quarantined (unvalidated induced) procedures are
excluded - they must not drive actions - unless the inspector opts
in via `includeQuarantined`.

Uses the storage adapter's FTS surface when available
(`procedural.search`, the default `@graphorin/store-sqlite` adapter
implements it via migration 028); otherwise degrades to an offline
in-memory token-overlap scan over [list](/api/@graphorin/memory/classes/ProceduralMemory.md#list), so custom adapters
keep working without the index.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts` | \{ `includeQuarantined?`: `boolean`; `topK?`: `number`; \} |
| `opts.includeQuarantined?` | `boolean` |
| `opts.topK?` | `number` |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Rule`](/api/@graphorin/core/interfaces/Rule.md)\&gt;[]\>

***

### validate()

```ts
validate(
   scope, 
   ruleId, 
   reason?, 
options?): Promise<void>;
```

Defined in: [packages/memory/src/tiers/procedural-memory.ts:421](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L421)

Promote a quarantined (induced) procedure into `activate()` (MCON-2).
Mirrors [SemanticMemory.validate](/api/@graphorin/memory/classes/SemanticMemory.md#validate): re-derives the injection verdict
from the stored rule text and **refuses** promotion of an injection-flagged
procedure unless an operator passes `{ force: true }`. Induced procedures
drive *actions*, so this gate matters most for them.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `ruleId` | `string` |
| `reason?` | `string` |
| `options?` | \{ `force?`: `boolean`; \} |
| `options.force?` | `boolean` |

#### Returns

`Promise`\&lt;`void`\&gt;
