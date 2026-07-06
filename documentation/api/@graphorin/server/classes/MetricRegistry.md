[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / MetricRegistry

# Class: MetricRegistry

Defined in: packages/server/src/metrics/registry.ts:57

Lightweight Prometheus registry. Each instance owns its metric
catalogue + per-label samples; `render()` emits the canonical text
exposition block.

## Stable

## Constructors

### Constructor

```ts
new MetricRegistry(): MetricRegistry;
```

#### Returns

`MetricRegistry`

## Methods

### contentType()

```ts
contentType(): string;
```

Defined in: packages/server/src/metrics/registry.ts:196

#### Returns

`string`

***

### inc()

```ts
inc(
   name, 
   labels?, 
   by?): void;
```

Defined in: packages/server/src/metrics/registry.ts:78

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `name` | `string` | `undefined` |
| `labels` | [`LabelSet`](/api/@graphorin/server/type-aliases/LabelSet.md) | `{}` |
| `by` | `number` | `1` |

#### Returns

`void`

***

### observe()

```ts
observe(
   name, 
   value, 
   labels?): void;
```

Defined in: packages/server/src/metrics/registry.ts:108

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `value` | `number` |
| `labels` | [`LabelSet`](/api/@graphorin/server/type-aliases/LabelSet.md) |

#### Returns

`void`

***

### registerCounter()

```ts
registerCounter(
   name, 
   help, 
   labelNames?): void;
```

Defined in: packages/server/src/metrics/registry.ts:63

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `name` | `string` | `undefined` |
| `help` | `string` | `undefined` |
| `labelNames` | readonly `string`[] | `[]` |

#### Returns

`void`

***

### registerGauge()

```ts
registerGauge(
   name, 
   help, 
   labelNames?): void;
```

Defined in: packages/server/src/metrics/registry.ts:68

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `name` | `string` | `undefined` |
| `help` | `string` | `undefined` |
| `labelNames` | readonly `string`[] | `[]` |

#### Returns

`void`

***

### registerSummary()

```ts
registerSummary(
   name, 
   help, 
   labelNames?): void;
```

Defined in: packages/server/src/metrics/registry.ts:73

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `name` | `string` | `undefined` |
| `help` | `string` | `undefined` |
| `labelNames` | readonly `string`[] | `[]` |

#### Returns

`void`

***

### render()

```ts
render(): string;
```

Defined in: packages/server/src/metrics/registry.ts:150

Render the current snapshot in Prometheus text exposition
format (v0.0.4). Never throws - incomplete sample buckets are
skipped instead of failing the scrape.

#### Returns

`string`

***

### reset()

```ts
reset(): void;
```

Defined in: packages/server/src/metrics/registry.ts:126

#### Returns

`void`

***

### set()

```ts
set(
   name, 
   value, 
   labels?): void;
```

Defined in: packages/server/src/metrics/registry.ts:97

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `value` | `number` |
| `labels` | [`LabelSet`](/api/@graphorin/server/type-aliases/LabelSet.md) |

#### Returns

`void`

***

### snapshot()

```ts
snapshot(): {
  counters: Record<string, ReadonlyArray<{
     labels: LabelSet;
     value: number;
  }>>;
  gauges: Record<string, ReadonlyArray<{
     labels: LabelSet;
     value: number;
  }>>;
  summaries: Record<string, ReadonlyArray<{
     count: number;
     labels: LabelSet;
     samples: ReadonlyArray<number>;
     sum: number;
  }>>;
};
```

Defined in: packages/server/src/metrics/registry.ts:201

Snapshot for tests / assertions.

#### Returns

```ts
{
  counters: Record<string, ReadonlyArray<{
     labels: LabelSet;
     value: number;
  }>>;
  gauges: Record<string, ReadonlyArray<{
     labels: LabelSet;
     value: number;
  }>>;
  summaries: Record<string, ReadonlyArray<{
     count: number;
     labels: LabelSet;
     samples: ReadonlyArray<number>;
     sum: number;
  }>>;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `counters` | `Record`\&lt;`string`, `ReadonlyArray`\&lt;\{ `labels`: [`LabelSet`](/api/@graphorin/server/type-aliases/LabelSet.md); `value`: `number`; \}\&gt;\&gt; | packages/server/src/metrics/registry.ts:202 |
| `gauges` | `Record`\&lt;`string`, `ReadonlyArray`\&lt;\{ `labels`: [`LabelSet`](/api/@graphorin/server/type-aliases/LabelSet.md); `value`: `number`; \}\&gt;\&gt; | packages/server/src/metrics/registry.ts:203 |
| `summaries` | `Record`\<`string`, `ReadonlyArray`\&lt;\{ `count`: `number`; `labels`: [`LabelSet`](/api/@graphorin/server/type-aliases/LabelSet.md); `samples`: `ReadonlyArray`\&lt;`number`\&gt;; `sum`: `number`; \}\&gt;\> | packages/server/src/metrics/registry.ts:204 |
