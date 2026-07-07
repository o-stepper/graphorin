[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createSseRoutes

# Function: createSseRoutes()

```ts
function createSseRoutes(deps): Hono<{
  Variables: ServerVariables;
}>;
```

Defined in: [packages/server/src/sse/events.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/sse/events.ts#L69)

Build the SSE event-stream router. Mounts
`GET /sessions/:id/events` (the canonical path documented in the
runtime spec); operators that want a different path should mount
the router under a custom prefix.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`SseRoutesDeps`](/api/@graphorin/server/interfaces/SseRoutesDeps.md) |

## Returns

`Hono`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>

## Stable
