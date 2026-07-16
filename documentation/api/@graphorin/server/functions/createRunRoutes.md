[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createRunRoutes

# Function: createRunRoutes()

```ts
function createRunRoutes(deps): Hono<{
  Variables: ServerVariables;
}>;
```

Defined in: [packages/server/src/routes/agents.ts:263](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/agents.ts#L263)

Companion router for the `/runs/...` surface. Kept separate so the
`createServer` factory can mount it under the top-level base path
rather than under `/agents`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`AgentRoutesDeps`](/api/@graphorin/server/interfaces/AgentRoutesDeps.md) |

## Returns

`Hono`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>

## Stable
