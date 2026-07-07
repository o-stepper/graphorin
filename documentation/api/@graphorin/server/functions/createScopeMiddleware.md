[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createScopeMiddleware

# Function: createScopeMiddleware()

```ts
function createScopeMiddleware(requirement): MiddlewareHandler<{
  Variables: ServerVariables;
}>;
```

Defined in: [packages/server/src/middleware/scope.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/scope.ts#L35)

## Parameters

| Parameter | Type |
| ------ | ------ |
| `requirement` | [`ScopeRequirement`](/api/@graphorin/server/type-aliases/ScopeRequirement.md) |

## Returns

`MiddlewareHandler`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>

## Stable
