[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createExtendedHealthRoutes

# Function: createExtendedHealthRoutes()

```ts
function createExtendedHealthRoutes(options): Hono<{
  Variables: ServerVariables;
}>;
```

Defined in: packages/server/src/health/routes.ts:42

**`Stable`**

Public health route (anonymous; mounted before auth middleware).
Returns the rollup + per-check breakdown; HTTP 200 even when the
rollup is `'degraded'` so liveness probes do not flap on minor
degradations. Only `'failing'` short-circuits with 503.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`HealthRouteOptions`](/api/@graphorin/server/interfaces/HealthRouteOptions.md) |

## Returns

`Hono`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>
