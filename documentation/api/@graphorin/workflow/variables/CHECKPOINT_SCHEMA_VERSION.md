[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / CHECKPOINT\_SCHEMA\_VERSION

# Variable: CHECKPOINT\_SCHEMA\_VERSION

```ts
const CHECKPOINT_SCHEMA_VERSION: "graphorin-workflow-checkpoint/1.0";
```

Defined in: [packages/workflow/src/internal/engine.ts:2349](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/internal/engine.ts#L2349)

Schema version embedded in every persisted checkpoint envelope.
Bumping the major part requires a documented migration path; the
minor part is reserved for additive fields the engine can ignore
when reading older checkpoints.
