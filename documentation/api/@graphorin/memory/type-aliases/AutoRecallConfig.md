[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / AutoRecallConfig

# Type Alias: AutoRecallConfig

```ts
type AutoRecallConfig = 
  | false
  | {
  strategy?: AutoRecallStrategy;
  threshold?: number;
  topK?: number;
};
```

Defined in: packages/memory/src/context-engine/engine.ts:102

Auto-recall config knob. `false` disables; `{ topK }` enables
the heuristic with a bounded top-K.

## Stable
