[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ScopeRequirement

# Type Alias: ScopeRequirement

```ts
type ScopeRequirement = 
  | string
  | ParsedScope
  | ((path, params) => 
  | string
  | ParsedScope);
```

Defined in: [packages/server/src/middleware/scope.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/scope.ts#L27)

Required-scope spec accepted by [createScopeMiddleware](/api/@graphorin/server/functions/createScopeMiddleware.md). Either
a single string (`'agents:invoke'`), a parsed scope, or a function
that derives the required scope from the request (e.g. to insert the
`:id` segment lazily).

## Stable
