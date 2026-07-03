[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / Sampler

# Interface: Sampler

Defined in: packages/observability/src/tracer/sampling.ts:69

## Stable

## Methods

### shouldIncludeChunkContent()

```ts
shouldIncludeChunkContent(): boolean;
```

Defined in: packages/observability/src/tracer/sampling.ts:75

Returns whether chunk *content* should travel through the exporter.

#### Returns

`boolean`

***

### shouldRecordEvent()

```ts
shouldRecordEvent(name): boolean;
```

Defined in: packages/observability/src/tracer/sampling.ts:73

Decide whether a span event of the given name should be recorded.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`boolean`

***

### shouldSample()

```ts
shouldSample(type, parentSampled?): boolean;
```

Defined in: packages/observability/src/tracer/sampling.ts:71

Decide whether a span of the given type should be recorded.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `string` |
| `parentSampled?` | `boolean` |

#### Returns

`boolean`
