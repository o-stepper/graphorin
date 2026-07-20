[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / CostAccumulator

# Interface: CostAccumulator

Defined in: packages/provider/src/middleware/with-cost-tracking.ts:42

**`Stable`**

A process-local cost accumulator. Wire [CostAccumulator.onUsage](/api/@graphorin/provider/interfaces/CostAccumulator.md#property-onusage)
into [withCostTracking](/api/@graphorin/provider/variables/withCostTracking.md) and read the running totals - keyed by
`provider × model` - back via [CostAccumulator.totals](/api/@graphorin/provider/interfaces/CostAccumulator.md#totals) /
[CostAccumulator.totalFor](/api/@graphorin/provider/interfaces/CostAccumulator.md#totalfor).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-onusage"></a> `onUsage` | `readonly` | (`info`) => `void` | Pass this to [withCostTracking](/api/@graphorin/provider/variables/withCostTracking.md)'s `onUsage`. | packages/provider/src/middleware/with-cost-tracking.ts:44 |

## Methods

### reset()

```ts
reset(): void;
```

Defined in: packages/provider/src/middleware/with-cost-tracking.ts:50

Clear all accumulated totals.

#### Returns

`void`

***

### totalFor()

```ts
totalFor(providerName, modelId): CostTrackingTotals;
```

Defined in: packages/provider/src/middleware/with-cost-tracking.ts:48

Running totals for one `provider × model` (zeros when unseen).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `providerName` | `string` |
| `modelId` | `string` |

#### Returns

[`CostTrackingTotals`](/api/@graphorin/provider/interfaces/CostTrackingTotals.md)

***

### totals()

```ts
totals(): ReadonlyMap<string, CostTrackingTotals>;
```

Defined in: packages/provider/src/middleware/with-cost-tracking.ts:46

Snapshot of every tracked `provider::model` → totals.

#### Returns

`ReadonlyMap`\&lt;`string`, [`CostTrackingTotals`](/api/@graphorin/provider/interfaces/CostTrackingTotals.md)\&gt;
