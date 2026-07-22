[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / getMiddlewareKind

# Function: getMiddlewareKind()

```ts
function getMiddlewareKind(provider): string | undefined;
```

Defined in: packages/provider/src/middleware/compose.ts:90

**`Stable`**

Read the discriminant kind attached to a middleware-produced
provider. Returns `undefined` if the provider is the bare adapter
or a custom wrapper that does not declare a kind.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provider` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) |

## Returns

`string` \| `undefined`
