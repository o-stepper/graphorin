[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunKind

# Type Alias: RunKind

```ts
type RunKind = "agent" | "workflow";
```

Defined in: packages/server/src/runtime/run-state.ts:47

**`Stable`**

Identifying tag for the underlying execution kind. Workflows run
on the durable engine in `@graphorin/workflow`; agents run on the
`@graphorin/agent` runtime.
