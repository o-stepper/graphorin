[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CheckpointId

# Type Alias: CheckpointId

```ts
type CheckpointId = string;
```

Defined in: packages/core/src/contracts/checkpoint-store.ts:8

**`Stable`**

Opaque identifier for a single workflow checkpoint. Treated as a string
by every consumer so adapters can pick whatever encoding they prefer
(ULID, UUID, snowflake-like, …).
