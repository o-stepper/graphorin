[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / awaitExternal

# Function: awaitExternal()

```ts
function awaitExternal<TResume>(name): TResume;
```

Defined in: [packages/core/dist/channels/durable.d.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts#L82)

Suspend on a named durable promise. The thread stays suspended (and
survives restarts) until an external caller resolves it via
`workflow.resolveAwakeable(threadId, name, value)`; that `value` is
returned here.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TResume` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

## Returns

`TResume`

## Stable
