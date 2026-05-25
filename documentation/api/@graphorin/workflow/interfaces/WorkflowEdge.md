[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowEdge

# Interface: WorkflowEdge\&lt;TState\&gt;

Defined in: packages/workflow/src/types.ts:205

Edge between two nodes. Edges with a `when` predicate fire only
when the predicate evaluates to truthy; unconditional edges always
fire when the source node completes.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-from"></a> `from` | `readonly` | `string` | packages/workflow/src/types.ts:206 |
| <a id="property-to"></a> `to` | `readonly` | `string` | packages/workflow/src/types.ts:207 |
| <a id="property-when"></a> `when?` | `readonly` | [`EdgePredicate`](/api/@graphorin/workflow/type-aliases/EdgePredicate.md)\&lt;`TState`\&gt; | packages/workflow/src/types.ts:208 |
