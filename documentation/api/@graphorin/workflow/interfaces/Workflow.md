[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Workflow

# Interface: Workflow\&lt;TState, TInput\&gt;

Defined in: packages/workflow/src/types.ts:411

Top-level handle returned by [createWorkflow](/api/@graphorin/workflow/factory/functions/createWorkflow.md).

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |
| `TInput` | `Partial`\&lt;`TState`\&gt; |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/workflow/src/types.ts:415 |
| <a id="property-nodenames"></a> `nodeNames` | `readonly` | readonly `string`[] | packages/workflow/src/types.ts:416 |

## Methods

### approve()

```ts
approve(
   threadId, 
   name, 
   decision, 
opts?): AsyncIterable<WorkflowEvent<TState>>;
```

Defined in: packages/workflow/src/types.ts:458

Resolve a named persisted approval (D1) - sugar over
[resolveAwakeable](/api/@graphorin/workflow/interfaces/Workflow.md#resolveawakeable) for `requestApproval(name)` suspensions.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `name` | `string` |
| `decision` | `unknown` |
| `opts?` | [`WorkflowResumeOptions`](/api/@graphorin/workflow/interfaces/WorkflowResumeOptions.md) |

#### Returns

`AsyncIterable`\<[`WorkflowEvent`](/api/@graphorin/workflow/type-aliases/WorkflowEvent.md)\&lt;`TState`\&gt;\>

***

### execute()

```ts
execute(input, opts?): AsyncIterable<WorkflowEvent<TState>>;
```

Defined in: packages/workflow/src/types.ts:417

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `TInput` |
| `opts?` | [`WorkflowExecuteOptions`](/api/@graphorin/workflow/interfaces/WorkflowExecuteOptions.md) |

#### Returns

`AsyncIterable`\<[`WorkflowEvent`](/api/@graphorin/workflow/type-aliases/WorkflowEvent.md)\&lt;`TState`\&gt;\>

***

### fork()

```ts
fork(threadId, fromCheckpointId): Promise<{
  newThreadId: string;
}>;
```

Defined in: packages/workflow/src/types.ts:466

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `fromCheckpointId` | `string` |

#### Returns

`Promise`\<\{
  `newThreadId`: `string`;
\}\>

***

### getState()

```ts
getState(threadId): Promise<WorkflowState<TState>>;
```

Defined in: packages/workflow/src/types.ts:464

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\<[`WorkflowState`](/api/@graphorin/workflow/interfaces/WorkflowState.md)\&lt;`TState`\&gt;\>

***

### listCheckpoints()

```ts
listCheckpoints(threadId): Promise<readonly Checkpoint[]>;
```

Defined in: packages/workflow/src/types.ts:465

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\&lt;readonly [`Checkpoint`](/api/@graphorin/workflow/interfaces/Checkpoint.md)[]\&gt;

***

### resolveAwakeable()

```ts
resolveAwakeable(
   threadId, 
   name, 
   value?, 
opts?): AsyncIterable<WorkflowEvent<TState>>;
```

Defined in: packages/workflow/src/types.ts:448

Resolve a named awakeable (durable promise, D1): the suspended
`awaitExternal(name)` call returns `value` and the thread resumes.
Fails with `pause-not-found` when no pending pause carries the name.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `name` | `string` |
| `value?` | `unknown` |
| `opts?` | [`WorkflowResumeOptions`](/api/@graphorin/workflow/interfaces/WorkflowResumeOptions.md) |

#### Returns

`AsyncIterable`\<[`WorkflowEvent`](/api/@graphorin/workflow/type-aliases/WorkflowEvent.md)\&lt;`TState`\&gt;\>

***

### resume()

```ts
resume(
   threadId, 
   directive?, 
opts?): AsyncIterable<WorkflowEvent<TState>>;
```

Defined in: packages/workflow/src/types.ts:418

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `directive?` | [`Directive`](/api/@graphorin/workflow/classes/Directive.md)\<`Record`\&lt;`string`, `unknown`\&gt;, `unknown`\> |
| `opts?` | [`WorkflowResumeOptions`](/api/@graphorin/workflow/interfaces/WorkflowResumeOptions.md) |

#### Returns

`AsyncIterable`\<[`WorkflowEvent`](/api/@graphorin/workflow/type-aliases/WorkflowEvent.md)\&lt;`TState`\&gt;\>

***

### retry()

```ts
retry(threadId, opts?): AsyncIterable<WorkflowEvent<TState>>;
```

Defined in: packages/workflow/src/types.ts:428

Restart a `'failed'` thread from its last failure checkpoint
(WF-3/WF-6): successful sibling tasks of the failed step replay
from their persisted pending writes; only the failed work re-runs.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `opts?` | [`WorkflowResumeOptions`](/api/@graphorin/workflow/interfaces/WorkflowResumeOptions.md) |

#### Returns

`AsyncIterable`\<[`WorkflowEvent`](/api/@graphorin/workflow/type-aliases/WorkflowEvent.md)\&lt;`TState`\&gt;\>

***

### tick()

```ts
tick(threadId, opts?): Promise<{
  fired: boolean;
  nextWakeAt: number | null;
}>;
```

Defined in: packages/workflow/src/types.ts:436

Fire due durable timers (D1). Scans the thread's pending pauses for
`sleepUntil` records whose `wakeAt` has passed; when one is due the
thread resumes (draining the resulting events internally). Returns
whether a timer fired and the next earliest wake-at (epoch ms) still
pending, so schedulers know when to call again.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `opts?` | \{ `now?`: `number`; \} |
| `opts.now?` | `number` |

#### Returns

`Promise`\<\{
  `fired`: `boolean`;
  `nextWakeAt`: `number` \| `null`;
\}\>
