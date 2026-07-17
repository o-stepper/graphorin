[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunStatus

# Type Alias: RunStatus

```ts
type RunStatus = "running" | "completed" | "failed" | "aborted" | "awaiting_approval";
```

Defined in: [packages/core/src/types/run.ts:14](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L14)

Status of an in-flight or completed agent run. Append-only persistence
stores expose this verbatim on the `runs` table.

## Stable
