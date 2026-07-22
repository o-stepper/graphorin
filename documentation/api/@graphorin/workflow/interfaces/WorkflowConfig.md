[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowConfig

# Interface: WorkflowConfig\&lt;TState\&gt;

Defined in: packages/workflow/src/types.ts:280

**`Stable`**

Configuration accepted by [createWorkflow](/api/@graphorin/workflow/factory/functions/createWorkflow.md). The shape is the
single point of contact between a consumer's workflow definition and
the runtime - every other public type derives from it.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cancelgracems"></a> `cancelGraceMs?` | `readonly` | `number` | Grace window (in milliseconds) applied after `AbortSignal.abort()` before in-flight task promises are considered orphaned. Default: 100 ms. | packages/workflow/src/types.ts:314 |
| <a id="property-channels"></a> `channels` | `readonly` | `Readonly`\&lt;`{ [K in keyof TState]: Channel<TState[K]> }`\&gt; | - | packages/workflow/src/types.ts:284 |
| <a id="property-checkpointstore"></a> `checkpointStore` | `readonly` | [`CheckpointStore`](/api/@graphorin/workflow/interfaces/CheckpointStore.md) | - | packages/workflow/src/types.ts:288 |
| <a id="property-durability"></a> `durability?` | `readonly` | [`DurabilityMode`](/api/@graphorin/workflow/type-aliases/DurabilityMode.md) | Default durability mode. Defaults to `sync`. | packages/workflow/src/types.ts:290 |
| <a id="property-edges"></a> `edges` | `readonly` | readonly [`WorkflowEdge`](/api/@graphorin/workflow/interfaces/WorkflowEdge.md)\&lt;`TState`\&gt;[] | - | packages/workflow/src/types.ts:283 |
| <a id="property-initialstate"></a> `initialState?` | `readonly` | `Partial`\&lt;`TState`\&gt; | Optional initial state - merged with the input on `execute(...)`. | packages/workflow/src/types.ts:286 |
| <a id="property-journalsteps"></a> `journalSteps?` | `readonly` | `boolean` | Step-result journaling (opt-in). When `true`, the engine journals a step-intent record plus each completed task's channel writes against the PARENT checkpoint as tasks finish, so a crash between task completion and the step checkpoint no longer re-runs completed side effects: crash recovery replays the journaled writes and re-runs only the unfinished tasks. Default `false` (one extra store write per completed task when on). | packages/workflow/src/types.ts:352 |
| <a id="property-maxconcurrenttasks"></a> `maxConcurrentTasks?` | `readonly` | `number` | Cap on tasks executing concurrently within one step. Planned tasks beyond the cap queue and start as slots free up; `Dispatch` fan-outs are bounded the same way. Absent ⇒ unbounded. | packages/workflow/src/types.ts:334 |
| <a id="property-maxsteps"></a> `maxSteps?` | `readonly` | `number` | Maximum number of execution steps before the engine bails out - an infinite-loop safeguard that surfaces as a structured error. Counted PER INVOCATION of execute/resume/retry/tick - a durable thread that cycles through timers and approvals for months never trips it, and a capped-out invocation is retryable (retry starts a fresh counter). Default: 200. | packages/workflow/src/types.ts:301 |
| <a id="property-maxtotalsteps"></a> `maxTotalSteps?` | `readonly` | `number` | Opt-in LIFETIME quota over the cumulative step number across every invocation of the thread. Default: undefined (no lifetime cap). Fails with the same `max-steps-exceeded` code but a distinct message. | packages/workflow/src/types.ts:308 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/workflow/src/types.ts:281 |
| <a id="property-nodedefaults"></a> `nodeDefaults?` | `readonly` | \{ `retry?`: [`WorkflowNodeRetryPolicy`](/api/@graphorin/workflow/interfaces/WorkflowNodeRetryPolicy.md); `timeoutMs?`: `number`; \} | Default per-node execution policy, overridden by the same fields on an individual [WorkflowNode](/api/@graphorin/workflow/interfaces/WorkflowNode.md). | packages/workflow/src/types.ts:325 |
| `nodeDefaults.retry?` | `readonly` | [`WorkflowNodeRetryPolicy`](/api/@graphorin/workflow/interfaces/WorkflowNodeRetryPolicy.md) | - | packages/workflow/src/types.ts:327 |
| `nodeDefaults.timeoutMs?` | `readonly` | `number` | - | packages/workflow/src/types.ts:326 |
| <a id="property-nodes"></a> `nodes` | `readonly` | `Readonly`\<`Record`\<`string`, [`WorkflowNode`](/api/@graphorin/workflow/interfaces/WorkflowNode.md)\&lt;`TState`\&gt;\>\> | - | packages/workflow/src/types.ts:282 |
| <a id="property-pauseat"></a> `pauseAt?` | `readonly` | [`WorkflowPauseAt`](/api/@graphorin/workflow/interfaces/WorkflowPauseAt.md) | - | packages/workflow/src/types.ts:287 |
| <a id="property-tracer"></a> `tracer?` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | Optional tracer; defaults to the framework's `NOOP_TRACER`. | packages/workflow/src/types.ts:292 |
| <a id="property-validatestate"></a> `validateState?` | `readonly` | (`state`) => `void` | Optional state validator. When provided, the engine calls it after applying every step's writes; any thrown error produces a `state-validation-failed` workflow error and aborts the run. | packages/workflow/src/types.ts:320 |
| <a id="property-version"></a> `version?` | `readonly` | `string` | Workflow definition version pin. Stamped into every persisted frontier; a resume whose stored version differs fails loudly with `workflow-version-mismatch` (opt out per call via [WorkflowResumeOptions.allowVersionMismatch](/api/@graphorin/workflow/interfaces/WorkflowResumeOptions.md#property-allowversionmismatch)). Absent ⇒ no pinning. | packages/workflow/src/types.ts:342 |
