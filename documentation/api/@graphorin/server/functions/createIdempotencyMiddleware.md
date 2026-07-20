[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createIdempotencyMiddleware

# Function: createIdempotencyMiddleware()

```ts
function createIdempotencyMiddleware(options): MiddlewareHandler<{
  Variables: ServerVariables;
}>;
```

Defined in: packages/server/src/middleware/idempotency.ts:72

**`Stable`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`IdempotencyMiddlewareOptions`](/api/@graphorin/server/interfaces/IdempotencyMiddlewareOptions.md) |

## Returns

`MiddlewareHandler`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>
