[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / awaitExternal

# Function: awaitExternal()

```ts
function awaitExternal<TResume>(name, options?): TResume;
```

Defined in: [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts)

**`Stable`**

Suspend on a named durable promise. The thread stays suspended (and
survives restarts) until an external caller resolves it via
`workflow.resolveAwakeable(threadId, name, value)`; that `value` is
returned here. With `options.schema` the value is validated on
delivery - see [AwakeablePayloadError](/api/@graphorin/core/classes/AwakeablePayloadError.md) for the rejection
semantics.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TResume` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `options?` | [`AwaitExternalOptions`](/api/@graphorin/core/interfaces/AwaitExternalOptions.md)\&lt;`TResume`\&gt; |

## Returns

`TResume`
