[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TerminalRunStatus

# Type Alias: TerminalRunStatus

```ts
type TerminalRunStatus = Extract<RunStatus, "completed" | "failed" | "aborted">;
```

Defined in: packages/server/src/runtime/run-state.ts:54

**`Stable`**

Terminal status a run can settle into (never `pending` / `running`).
