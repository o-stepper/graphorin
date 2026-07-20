[**Graphorin API reference v0.13.8**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/vercel](/api/@graphorin/provider/adapters/vercel/index.md) / \_\_resetVercelRuntimeCache

# Function: \_\_resetVercelRuntimeCache()

```ts
function __resetVercelRuntimeCache(): void;
```

Defined in: packages/provider/src/adapters/vercel.ts:704

**`Internal`**

Test-only hook that resets the cached AI SDK runtime. Provider tests
that mutate the cache (e.g. by injecting a mock then verifying the
default loader runs) call this between scenarios.

## Returns

`void`
