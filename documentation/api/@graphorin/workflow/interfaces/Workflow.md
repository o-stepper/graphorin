[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Workflow

# Interface: Workflow\&lt;TState, TInput\&gt;

Defined in: packages/workflow/src/types.ts:430

**`Stable`**

Top-level handle returned by [createWorkflow](/api/@graphorin/workflow/factory/functions/createWorkflow.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |
| `TInput` | `Partial`\&lt;`TState`\&gt; |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/workflow/src/types.ts:434 |
| <a id="property-nodenames"></a> `nodeNames` | `readonly` | readonly `string`[] | packages/workflow/src/types.ts:435 |

## Methods

### approve()

```ts
approve(
   threadId, 
   name, 
   decision, 
opts?): AsyncIterable<WorkflowEvent<TState>>;
```

Defined in: packages/workflow/src/types.ts:477

Resolve a named persisted approval - sugar over
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

### deleteThread()

```ts
deleteThread(threadId): Promise<void>;
```

Defined in: packages/workflow/src/types.ts:492

Delete every checkpoint and pending write of `threadId` across all
namespaces - the operator lever for per-thread hygiene and
targeted erasure requests. Idempotent: deleting an unknown thread
is a no-op. Deleting a merely-suspended thread (pending approval /
timer / awakeable) destroys its resume state - the caller decides.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### execute()

```ts
execute(input, opts?): AsyncIterable<WorkflowEvent<TState>>;
```

Defined in: packages/workflow/src/types.ts:436

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
fork(
   threadId, 
   fromCheckpointId, 
   opts?): Promise<{
  newThreadId: string;
}>;
```

Defined in: packages/workflow/src/types.ts:501

Clone `threadId`'s timeline at `fromCheckpointId` into a fresh
thread (the original stays untouched). `opts.patch` merges
channel-level values into the forked root's state (branch here,
but with these corrected values) - keys must name declared
channels, and the merged state re-runs the JSON-safety guard.
`channelVersions` and pending writes ride along unchanged.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `fromCheckpointId` | `string` |
| `opts?` | \{ `patch?`: `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>; \} |
| `opts.patch?` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> |

#### Returns

`Promise`\<\{
  `newThreadId`: `string`;
\}\>

***

### getState()

```ts
getState(threadId): Promise<WorkflowState<TState>>;
```

Defined in: packages/workflow/src/types.ts:483

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

Defined in: packages/workflow/src/types.ts:484

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

Defined in: packages/workflow/src/types.ts:467

Resolve a named awakeable (durable promise): the suspended
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

Defined in: packages/workflow/src/types.ts:437

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

Defined in: packages/workflow/src/types.ts:447

Restart a `'failed'` thread from its last failure checkpoint:
successful sibling tasks of the failed step replay from their
persisted pending writes; only the failed work re-runs.

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

Defined in: packages/workflow/src/types.ts:455

Fire due durable timers. Scans the thread's pending pauses for
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
