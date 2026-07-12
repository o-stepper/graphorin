[**Graphorin API reference v0.8.0**](../../../index.md)

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

Defined in: [packages/memory/src/context-engine/engine.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/engine.ts#L112)

Auto-recall config knob. `false` disables; `{ topK }` enables
the heuristic with a bounded top-K.

## Union Members

`false`

***

### Type Literal

```ts
{
  strategy?: AutoRecallStrategy;
  threshold?: number;
  topK?: number;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `strategy?` | [`AutoRecallStrategy`](/api/@graphorin/memory/type-aliases/AutoRecallStrategy.md) | - | [packages/memory/src/context-engine/engine.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/engine.ts#L125) |
| `threshold?` | `number` | Minimum fused score a hit must reach to be injected. **Default `0`** (CE-4) - `topK` already bounds the volume. The scale is reranker-dependent: the default RRF reranker fuses the FTS + vector candidate lists as `1/(60 + rank)` per list, so scores top out near `2/(60 + 1) ≈ 0.033` - any positive default would silently drop every hit. Set this only when calibrating against a known reranker's scale. | [packages/memory/src/context-engine/engine.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/engine.ts#L124) |
| `topK?` | `number` | - | [packages/memory/src/context-engine/engine.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/engine.ts#L115) |

## Stable
