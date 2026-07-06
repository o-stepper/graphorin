[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunStateUsageByModel

# Interface: RunStateUsageByModel

Defined in: [packages/core/src/types/run.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L67)

Per-model usage breakdown carried alongside the aggregate
[Usage](/api/@graphorin/core/interfaces/Usage.md) on [RunState](/api/@graphorin/core/interfaces/RunState.md). Populated by the per-step retry
loop when `Agent.fallbackModels` fires; for runs that never fall
back, the map carries a single entry for the primary model with
`attemptCount: 1`.

The aggregate `RunState.usage` is always the sum of every entry's
`Usage` portion (the field is asserted in tests).

## Stable

## Indexable

```ts
[modelId: string]: Usage & {
  attemptCount: number;
}
```
