[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / resolveTriggerThreshold

# Function: resolveTriggerThreshold()

```ts
function resolveTriggerThreshold(input): number;
```

Defined in: [packages/memory/src/context-engine/compaction/thresholds.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/thresholds.ts#L56)

Resolve the effective threshold (in tokens) at which the
auto-trigger fires. The implementation matches the suggested
DEC-162 row 2 spec:

```
effectiveThreshold = min(
  contextWindow * thresholdRatio,
  contextWindow - reservedForResponse - reservedForCompaction,
);
```

Operators override per `CompactionConfig.trigger.{thresholdTokens,
thresholdRatio}`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `contextWindow`: `number`; `reservedForCompaction?`: `number`; `reservedForResponse?`: `number`; `trigger?`: \| [`CompactionTriggerConfig`](/api/@graphorin/memory/interfaces/CompactionTriggerConfig.md) \| `"never"`; \} |
| `input.contextWindow` | `number` |
| `input.reservedForCompaction?` | `number` |
| `input.reservedForResponse?` | `number` |
| `input.trigger?` | \| [`CompactionTriggerConfig`](/api/@graphorin/memory/interfaces/CompactionTriggerConfig.md) \| `"never"` |

## Returns

`number`

## Stable
