[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createAuthMiddleware

# Function: createAuthMiddleware()

```ts
function createAuthMiddleware(options): MiddlewareHandler<{
  Variables: ServerVariables;
}>;
```

Defined in: [packages/server/src/middleware/auth.ts:130](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/auth.ts#L130)

Build the bearer-token middleware. The middleware always sets
`c.var.state.auth`, even on the unauthenticated branch, so
downstream code can pattern-match the discriminated union without
a separate "is anonymous?" check.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`AuthMiddlewareOptions`](/api/@graphorin/server/interfaces/AuthMiddlewareOptions.md) |

## Returns

`MiddlewareHandler`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>

## Stable
