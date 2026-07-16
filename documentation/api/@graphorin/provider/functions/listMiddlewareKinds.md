[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / listMiddlewareKinds

# Function: listMiddlewareKinds()

```ts
function listMiddlewareKinds(provider): readonly string[];
```

Defined in: [packages/provider/src/middleware/compose.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/compose.ts#L100)

Walk the middleware chain inside `provider` and return the array of
declared kinds (outer → inner).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provider` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) |

## Returns

readonly `string`[]

## Stable
