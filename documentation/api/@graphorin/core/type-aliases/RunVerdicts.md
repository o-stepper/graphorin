[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunVerdicts

# Type Alias: RunVerdicts

```ts
type RunVerdicts = Record<string, RunTurnVerdict>;
```

Defined in: [packages/core/src/types/run.ts:265](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L265)

B3: the plain-object verdict sidecar on [RunState.verdicts](/api/@graphorin/core/interfaces/RunState.md#property-verdicts).
Keys are turn positions `'<stepNumber>:<offsetInStep>'`. A plain
JSON-safe object on purpose (core `Message` has no id and `Map` is
not JSON-serializable).

## Stable
