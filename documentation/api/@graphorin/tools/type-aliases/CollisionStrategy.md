[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / CollisionStrategy

# Type Alias: CollisionStrategy

```ts
type CollisionStrategy = "auto-prefix" | "priority" | "manual";
```

Defined in: packages/tools/src/registry/types.ts:23

Strategy for resolving cross-source tool-name collisions.

- `'auto-prefix'` (default) - rename losers with a stable
  namespace-derived prefix (e.g. `linear.search_issues` for an MCP
  server identifying as `linear`).
- `'priority'`              - keep the highest-priority registration
  per the precedence ladder; drop the rest.
- `'manual'`                - refuse to register the loser; throw
  [ToolCollisionError](/api/@graphorin/tools/errors/classes/ToolCollisionError.md) with a structured payload so the
  operator can configure either renaming or filtering.

## Stable
