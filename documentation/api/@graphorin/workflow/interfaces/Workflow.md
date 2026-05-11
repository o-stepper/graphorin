[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Workflow

# Interface: Workflow\&lt;TState, TInput\&gt;

Defined in: packages/workflow/src/types.ts:303

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
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/workflow/src/types.ts:307 |
| <a id="property-nodenames"></a> `nodeNames` | `readonly` | readonly `string`[] | packages/workflow/src/types.ts:308 |

## Methods

### execute()

```ts
execute(input, opts?): AsyncIterable<WorkflowEvent<TState>>;
```

Defined in: packages/workflow/src/types.ts:309

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

Defined in: packages/workflow/src/types.ts:317

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

Defined in: packages/workflow/src/types.ts:315

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

Defined in: packages/workflow/src/types.ts:316

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\&lt;readonly [`Checkpoint`](/api/@graphorin/workflow/interfaces/Checkpoint.md)[]\&gt;

***

### resume()

```ts
resume(
   threadId, 
   directive?, 
opts?): AsyncIterable<WorkflowEvent<TState>>;
```

Defined in: packages/workflow/src/types.ts:310

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `directive?` | [`Directive`](/api/@graphorin/workflow/classes/Directive.md)\<`Record`\&lt;`string`, `unknown`\&gt;, `unknown`\> |
| `opts?` | [`WorkflowResumeOptions`](/api/@graphorin/workflow/interfaces/WorkflowResumeOptions.md) |

#### Returns

`AsyncIterable`\<[`WorkflowEvent`](/api/@graphorin/workflow/type-aliases/WorkflowEvent.md)\&lt;`TState`\&gt;\>
