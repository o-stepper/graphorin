[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunStatus

# Type Alias: RunStatus

```ts
type RunStatus = "pending" | "running" | "completed" | "failed" | "aborted";
```

Defined in: [packages/server/src/runtime/run-state.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L25)

Stable status discriminator for a run snapshot. Mirrors the values
exposed on the public REST surface.

## Stable
