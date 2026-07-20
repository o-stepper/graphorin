[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunStatus

# Type Alias: RunStatus

```ts
type RunStatus = "running" | "completed" | "failed" | "aborted" | "awaiting_approval";
```

Defined in: packages/core/src/types/run.ts:15

**`Stable`**

Status of an in-flight or completed agent run. Append-only persistence
stores expose this verbatim on the `runs` table.
