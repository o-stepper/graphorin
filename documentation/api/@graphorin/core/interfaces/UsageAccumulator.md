[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / UsageAccumulator

# Interface: UsageAccumulator

Defined in: packages/core/src/types/usage.ts:55

A live accumulator of token / cost figures. Implementations live in
`@graphorin/observability`. The contract sits here so every package
(agent, workflow, server, …) can type a parameter as `UsageAccumulator`
without taking an observability dependency.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-bymodel"></a> `byModel` | `readonly` | `ReadonlyMap`\&lt;`string`, [`ModelUsage`](/api/@graphorin/core/interfaces/ModelUsage.md)\&gt; | Per-model breakdown; preserves call counts for observability. | packages/core/src/types/usage.ts:59 |
| <a id="property-total"></a> `total` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | Current rolled-up totals across every model that has been added. | packages/core/src/types/usage.ts:57 |

## Methods

### add()

```ts
add(modelId, usage): void;
```

Defined in: packages/core/src/types/usage.ts:62

Add a single LLM-call usage record under the given model id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `modelId` | `string` |
| `usage` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) |

#### Returns

`void`

***

### reset()

```ts
reset(): void;
```

Defined in: packages/core/src/types/usage.ts:64

Reset the accumulator to a zeroed state.

#### Returns

`void`

***

### snapshot()

```ts
snapshot(): UsageSnapshot;
```

Defined in: packages/core/src/types/usage.ts:66

Render an immutable snapshot suitable for serialization / span attrs.

#### Returns

[`UsageSnapshot`](/api/@graphorin/core/interfaces/UsageSnapshot.md)
