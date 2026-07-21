[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / dispatch

# Function: dispatch()

```ts
function dispatch<TArgs>(nodeName, args): Dispatch<TArgs>;
```

Defined in: [packages/core/dist/channels/dispatch.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/dispatch.d.ts)

**`Stable`**

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

[`Dispatch`](/api/@graphorin/workflow/classes/Dispatch.md)\&lt;`TArgs`\&gt;
