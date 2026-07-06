[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowEdge

# Interface: WorkflowEdge\<TState\>

Defined in: packages/workflow/src/types.ts:254

Edge between two nodes. Edges with a `when` predicate fire only
when the predicate evaluates to truthy; unconditional edges always
fire when the source node completes.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\<`string`, `unknown`\> |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-from"></a> `from` | `readonly` | `string` | packages/workflow/src/types.ts:255 |
| <a id="property-to"></a> `to` | `readonly` | `string` | packages/workflow/src/types.ts:256 |
| <a id="property-when"></a> `when?` | `readonly` | [`EdgePredicate`](/api/@graphorin/workflow/type-aliases/EdgePredicate.md)\<`TState`\> | packages/workflow/src/types.ts:257 |
