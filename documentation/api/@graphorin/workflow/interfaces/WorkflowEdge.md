[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowEdge

# Interface: WorkflowEdge\&lt;TState\&gt;

Defined in: [packages/workflow/src/types.ts:254](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L254)

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
| <a id="property-from"></a> `from` | `readonly` | `string` | [packages/workflow/src/types.ts:255](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L255) |
| <a id="property-to"></a> `to` | `readonly` | `string` | [packages/workflow/src/types.ts:256](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L256) |
| <a id="property-when"></a> `when?` | `readonly` | [`EdgePredicate`](/api/@graphorin/workflow/type-aliases/EdgePredicate.md)\&lt;`TState`\&gt; | [packages/workflow/src/types.ts:257](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L257) |
