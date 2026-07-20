[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / providerHasMiddleware

# Function: providerHasMiddleware()

```ts
function providerHasMiddleware(provider, name): boolean;
```

Defined in: packages/provider/src/middleware/compose.ts:117

**`Stable`**

Return `true` iff the chain rooted at `provider` contains a
middleware whose kind matches `name`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provider` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) |
| `name` | `string` |

## Returns

`boolean`
