[**Graphorin API reference v0.13.7**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [middleware](/api/@graphorin/server/middleware/index.md) / createAnonymousAuthMiddleware

# Function: createAnonymousAuthMiddleware()

```ts
function createAnonymousAuthMiddleware(): MiddlewareHandler<{
  Variables: ServerVariables;
}>;
```

Defined in: packages/server/src/middleware/auth.ts:38

**`Stable`**

Build the no-auth middleware mounted when `auth.kind = 'none'`. It stamps
`state.auth = { kind: 'anonymous', grantedScopes: [admin:*] }` so the
scope middleware, SSE handler and replay routes all treat the request as a
fully-authorized principal. This is the documented trusted-loopback /
single-operator mode - never mount it on a non-loopback deployment without
understanding that every endpoint becomes open.

## Returns

`MiddlewareHandler`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>
