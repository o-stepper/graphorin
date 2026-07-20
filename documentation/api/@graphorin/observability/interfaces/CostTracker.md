[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostTracker

# Interface: CostTracker

Defined in: packages/observability/src/cost/cost-tracker.ts:28

**`Stable`**

## Methods

### onRollup()

```ts
onRollup(listener): () => void;
```

Defined in: packages/observability/src/cost/cost-tracker.ts:38

Subscribe to per-scope rollup notifications. Returns an unsubscribe.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | (`input`) => `void` |

#### Returns

() => `void`

***

### record()

```ts
record(input): void;
```

Defined in: packages/observability/src/cost/cost-tracker.ts:30

Record a single LLM-call usage / cost figure.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`CostRecordInput`](/api/@graphorin/observability/interfaces/CostRecordInput.md) |

#### Returns

`void`

***

### reset()

```ts
reset(): void;
```

Defined in: packages/observability/src/cost/cost-tracker.ts:36

Reset every counter back to zero.

#### Returns

`void`

***

### usage()

```ts
usage(scope, id): CostSnapshot;
```

Defined in: packages/observability/src/cost/cost-tracker.ts:32

Snapshot for a given scope id. Returns zero figures when unknown.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`CostScope`](/api/@graphorin/observability/type-aliases/CostScope.md) |
| `id` | `string` |

#### Returns

[`CostSnapshot`](/api/@graphorin/observability/interfaces/CostSnapshot.md)

***

### usageForSpan()

```ts
usageForSpan(spanId): CostSnapshot;
```

Defined in: packages/observability/src/cost/cost-tracker.ts:34

Snapshot for a single span id (carries nested attributions).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spanId` | `string` |

#### Returns

[`CostSnapshot`](/api/@graphorin/observability/interfaces/CostSnapshot.md)
