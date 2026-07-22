[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createRateLimitMiddleware

# Function: createRateLimitMiddleware()

```ts
function createRateLimitMiddleware(config, options?): MiddlewareHandler<{
  Variables: ServerVariables;
}>;
```

Defined in: packages/server/src/middleware/rate-limit.ts:23

**`Stable`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | \{ `enabled`: `boolean`; `perIpRequests`: `number`; `windowMs`: `number`; \} |
| `config.enabled` | `boolean` |
| `config.perIpRequests` | `number` |
| `config.windowMs` | `number` |
| `options` | \{ `now?`: () => `number`; \} |
| `options.now?` | () => `number` |

## Returns

`MiddlewareHandler`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>
