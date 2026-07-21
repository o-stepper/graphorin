[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / StopCondition

# Interface: StopCondition

Defined in: packages/core/src/types/stop-condition.ts:14

**`Stable`**

Predicate consulted by the agent runtime after every step to decide
whether the loop should stop.

Stop conditions are pure - they look at the current `RunState` and
return a boolean. The runtime never re-orders or short-circuits the
order in which operands of `and` / `or` are evaluated, so users can
rely on the obvious left-to-right semantics.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-check"></a> `check` | `readonly` | (`state`) => `boolean` | Returns `true` when the run should stop on this state. | packages/core/src/types/stop-condition.ts:18 |
| <a id="property-description"></a> `description` | `readonly` | `string` | Human-friendly label included in observability spans. | packages/core/src/types/stop-condition.ts:16 |
