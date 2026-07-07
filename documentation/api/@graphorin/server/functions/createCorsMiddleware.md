[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createCorsMiddleware

# Function: createCorsMiddleware()

```ts
function createCorsMiddleware(config): MiddlewareHandler<{
  Variables: ServerVariables;
}>;
```

Defined in: [packages/server/src/middleware/cors.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/cors.ts#L17)

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | \{ `allowCredentials`: `boolean`; `allowHeaders`: readonly `string`[]; `allowMethods`: readonly `string`[]; `allowOrigins`: readonly `string`[]; `maxAgeSeconds`: `number`; \} |
| `config.allowCredentials` | `boolean` |
| `config.allowHeaders` | readonly `string`[] |
| `config.allowMethods` | readonly `string`[] |
| `config.allowOrigins` | readonly `string`[] |
| `config.maxAgeSeconds` | `number` |

## Returns

`MiddlewareHandler`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>

## Stable
