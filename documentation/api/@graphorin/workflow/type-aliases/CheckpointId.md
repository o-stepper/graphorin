[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / CheckpointId

# Type Alias: CheckpointId

```ts
type CheckpointId = string;
```

Defined in: [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts)

Opaque identifier for a single workflow checkpoint. Treated as a string
by every consumer so adapters can pick whatever encoding they prefer
(ULID, UUID, snowflake-like, …).

## Stable
