[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createAuthRoutes

# Function: createAuthRoutes()

```ts
function createAuthRoutes(deps): Hono<{
  Variables: ServerVariables;
}>;
```

Defined in: packages/server/src/routes/auth.ts:39

Build the auth router. The router is mounted at the same base path
as the rest of the REST surface (defaults to `/v1`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`AuthRoutesDeps`](/api/@graphorin/server/interfaces/AuthRoutesDeps.md) |

## Returns

`Hono`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>

## Stable
