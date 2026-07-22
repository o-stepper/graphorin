[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createAuditMiddleware

# Function: createAuditMiddleware()

```ts
function createAuditMiddleware(options): MiddlewareHandler<{
  Variables: ServerVariables;
}>;
```

Defined in: packages/server/src/middleware/audit.ts:66

**`Stable`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`AuditMiddlewareOptions`](/api/@graphorin/server/interfaces/AuditMiddlewareOptions.md) |

## Returns

`MiddlewareHandler`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>
