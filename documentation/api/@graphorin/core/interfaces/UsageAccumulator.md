[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / UsageAccumulator

# Interface: UsageAccumulator

Defined in: packages/core/src/types/usage.ts:89

**`Stable`**

A live accumulator of token / cost figures. Implementations live in
`@graphorin/observability`. The contract sits here so every package
(agent, workflow, server, …) can type a parameter as `UsageAccumulator`
without taking an observability dependency.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-bymodel"></a> `byModel` | `readonly` | `ReadonlyMap`\&lt;`string`, [`ModelUsage`](/api/@graphorin/core/interfaces/ModelUsage.md)\&gt; | Per-model breakdown; preserves call counts for observability. | packages/core/src/types/usage.ts:93 |
| <a id="property-total"></a> `total` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | Current rolled-up totals across every model that has been added. | packages/core/src/types/usage.ts:91 |

## Methods

### add()

```ts
add(modelId, usage): void;
```

Defined in: packages/core/src/types/usage.ts:96

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

Defined in: packages/core/src/types/usage.ts:98

Reset the accumulator to a zeroed state.

#### Returns

`void`

***

### snapshot()

```ts
snapshot(): UsageSnapshot;
```

Defined in: packages/core/src/types/usage.ts:100

Render an immutable snapshot suitable for serialization / span attrs.

#### Returns

[`UsageSnapshot`](/api/@graphorin/core/interfaces/UsageSnapshot.md)
