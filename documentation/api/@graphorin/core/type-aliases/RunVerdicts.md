[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunVerdicts

# Type Alias: RunVerdicts

```ts
type RunVerdicts = Record<string, RunTurnVerdict>;
```

Defined in: packages/core/src/types/run.ts:272

**`Stable`**

The plain-object verdict sidecar on [RunState.verdicts](/api/@graphorin/core/interfaces/RunState.md#property-verdicts).
Keys are turn positions `'<stepNumber>:<offsetInStep>'`. A plain
JSON-safe object on purpose (core `Message` has no id and `Map` is
not JSON-serializable).
