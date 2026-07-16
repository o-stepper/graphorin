[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createAuditMiddleware

# Function: createAuditMiddleware()

```ts
function createAuditMiddleware(options): MiddlewareHandler<{
  Variables: ServerVariables;
}>;
```

Defined in: [packages/server/src/middleware/audit.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/audit.ts#L66)

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`AuditMiddlewareOptions`](/api/@graphorin/server/interfaces/AuditMiddlewareOptions.md) |

## Returns

`MiddlewareHandler`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>

## Stable
