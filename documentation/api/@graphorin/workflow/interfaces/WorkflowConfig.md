[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowConfig

# Interface: WorkflowConfig\&lt;TState\&gt;

Defined in: packages/workflow/src/types.ts:231

Configuration accepted by [createWorkflow](/api/@graphorin/workflow/factory/functions/createWorkflow.md). The shape is the
single point of contact between a consumer's workflow definition and
the runtime — every other public type derives from it.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cancelgracems"></a> `cancelGraceMs?` | `readonly` | `number` | Grace window (in milliseconds) applied after `AbortSignal.abort()` before in-flight task promises are considered orphaned. Default: 100 ms. | packages/workflow/src/types.ts:255 |
| <a id="property-channels"></a> `channels` | `readonly` | `Readonly`\&lt;`{ [K in keyof TState]: Channel<TState[K]> }`\&gt; | - | packages/workflow/src/types.ts:235 |
| <a id="property-checkpointstore"></a> `checkpointStore` | `readonly` | [`CheckpointStore`](/api/@graphorin/workflow/interfaces/CheckpointStore.md) | - | packages/workflow/src/types.ts:239 |
| <a id="property-durability"></a> `durability?` | `readonly` | [`DurabilityMode`](/api/@graphorin/workflow/type-aliases/DurabilityMode.md) | Default durability mode. Defaults to `sync`. | packages/workflow/src/types.ts:241 |
| <a id="property-edges"></a> `edges` | `readonly` | readonly [`WorkflowEdge`](/api/@graphorin/workflow/interfaces/WorkflowEdge.md)\&lt;`TState`\&gt;[] | - | packages/workflow/src/types.ts:234 |
| <a id="property-initialstate"></a> `initialState?` | `readonly` | `Partial`\&lt;`TState`\&gt; | Optional initial state — merged with the input on `execute(...)`. | packages/workflow/src/types.ts:237 |
| <a id="property-maxsteps"></a> `maxSteps?` | `readonly` | `number` | Maximum number of execution steps before the engine bails out — an infinite-loop safeguard that surfaces as a structured error. Default: 200. | packages/workflow/src/types.ts:249 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/workflow/src/types.ts:232 |
| <a id="property-nodes"></a> `nodes` | `readonly` | `Readonly`\<`Record`\<`string`, [`WorkflowNode`](/api/@graphorin/workflow/interfaces/WorkflowNode.md)\&lt;`TState`\&gt;\>\> | - | packages/workflow/src/types.ts:233 |
| <a id="property-pauseat"></a> `pauseAt?` | `readonly` | [`WorkflowPauseAt`](/api/@graphorin/workflow/interfaces/WorkflowPauseAt.md) | - | packages/workflow/src/types.ts:238 |
| <a id="property-tracer"></a> `tracer?` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | Optional tracer; defaults to the framework's `NOOP_TRACER`. | packages/workflow/src/types.ts:243 |
| <a id="property-validatestate"></a> `validateState?` | `readonly` | (`state`) => `void` | Optional state validator. When provided, the engine calls it after applying every step's writes; any thrown error produces a `state-validation-failed` workflow error and aborts the run. | packages/workflow/src/types.ts:261 |
