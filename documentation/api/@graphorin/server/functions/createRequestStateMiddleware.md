[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createRequestStateMiddleware

# Function: createRequestStateMiddleware()

```ts
function createRequestStateMiddleware(options?): MiddlewareHandler<{
  Variables: ServerVariables;
}>;
```

Defined in: packages/server/src/middleware/request-state.ts:47

**`Stable`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`RequestStateMiddlewareOptions`](/api/@graphorin/server/interfaces/RequestStateMiddlewareOptions.md) |

## Returns

`MiddlewareHandler`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>
