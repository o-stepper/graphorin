[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorTriggerSpec

# Type Alias: ConsolidatorTriggerSpec

```ts
type ConsolidatorTriggerSpec = 
  | `turn:${number}`
  | `idle:${string}`
  | `cron:${string}`
  | `event:${string}`
  | `budget:${number}`
  | `buffer:${number}`;
```

Defined in: [packages/memory/src/consolidator/types.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L65)

Trigger discriminator. The `'turn:N'` and `'idle:Xm'` variants are
the production defaults per DEC-133. `'cron:EXPR'`, `'event:NAME'`
and `'budget:N'` are opt-in.

## Stable
