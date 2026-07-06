[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / dispatch

# Function: dispatch()

```ts
function dispatch<TArgs>(nodeName, args): Dispatch<TArgs>;
```

Defined in: [packages/core/src/channels/dispatch.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/dispatch.ts#L35)

Convenience factory equivalent to `new Dispatch(nodeName, args)`.

## Type Parameters

| Type Parameter |
| ------ |
| `TArgs` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `nodeName` | `string` |
| `args` | `TArgs` |

## Returns

[`Dispatch`](/api/@graphorin/core/classes/Dispatch.md)\&lt;`TArgs`\&gt;

## Stable
