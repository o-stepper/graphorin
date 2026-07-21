[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorLike

# Interface: ConsolidatorLike

Defined in: packages/memory/src/consolidator/scheduler.ts:38

**`Stable`**

Subset of the `Consolidator` runtime surface the bridge needs.
Defined structurally - mirroring [SchedulerLike](/api/@graphorin/memory/interfaces/SchedulerLike.md) - so this
module never imports `./runtime.js` (which imports the bridge) and
the consolidator module graph stays acyclic (issue #22). The full
`Consolidator` is assignable as-is.

## Methods

### config()

```ts
config(): {
  triggers: readonly ConsolidatorTriggerSpec[];
};
```

Defined in: packages/memory/src/consolidator/scheduler.ts:40

#### Returns

```ts
{
  triggers: readonly ConsolidatorTriggerSpec[];
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `triggers` | readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[] | packages/memory/src/consolidator/scheduler.ts:40 |

***

### trigger()

```ts
trigger(reason, scope): Promise<
  | PhaseOutcome
| null>;
```

Defined in: packages/memory/src/consolidator/scheduler.ts:39

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason` | [`ConsolidatorTriggerReason`](/api/@graphorin/memory/interfaces/ConsolidatorTriggerReason.md) |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\<
  \| [`PhaseOutcome`](/api/@graphorin/memory/interfaces/PhaseOutcome.md)
  \| `null`\>
