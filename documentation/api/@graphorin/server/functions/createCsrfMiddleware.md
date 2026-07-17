[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createCsrfMiddleware

# Function: createCsrfMiddleware()

```ts
function createCsrfMiddleware(config): MiddlewareHandler<{
  Variables: ServerVariables;
}>;
```

Defined in: [packages/server/src/middleware/csrf.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/csrf.ts#L23)

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | \{ `cookieName`: `string`; `enabled`: `boolean`; `headerName`: `string`; `safeMethods`: readonly `string`[]; \} |
| `config.cookieName` | `string` |
| `config.enabled` | `boolean` |
| `config.headerName` | `string` |
| `config.safeMethods` | readonly `string`[] |

## Returns

`MiddlewareHandler`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>

## Stable
