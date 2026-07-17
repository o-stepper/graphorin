[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / GraphorinTracer

# Interface: GraphorinTracer

Defined in: [packages/observability/src/tracer/tracer.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/tracer.ts#L88)

The [createTracer](/api/@graphorin/observability/functions/createTracer.md) return value extends the standard
[Tracer](/api/@graphorin/core/interfaces/Tracer.md) contract from `@graphorin/core` with introspection
helpers (counter snapshots, validator handle).

## Stable

## Extends

- [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-servicename"></a> `serviceName` | `readonly` | `string` | Service name embedded in the OTLP resource. | [packages/observability/src/tracer/tracer.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/tracer.ts#L90) |
| <a id="property-validator"></a> `validator` | `readonly` | \| [`RedactionValidatorInstance`](/api/@graphorin/observability/interfaces/RedactionValidatorInstance.md) \| `null` | The tracer-managed validator. `null` when `validation: 'off'`. | [packages/observability/src/tracer/tracer.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/tracer.ts#L98) |

## Methods

### flush()

```ts
flush(): Promise<void>;
```

Defined in: [packages/observability/src/tracer/tracer.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/tracer.ts#L100)

Force-flush every registered exporter.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### getMetrics()

```ts
getMetrics(): RedactionCounters;
```

Defined in: [packages/observability/src/tracer/tracer.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/tracer.ts#L96)

Snapshot of the redaction counters (`droppedTotal`,
`droppedByReason`, `matchesByPattern`) maintained by the
tracer-managed validator.

#### Returns

[`RedactionCounters`](/api/@graphorin/observability/interfaces/RedactionCounters.md)

***

### shutdown()

```ts
shutdown(): Promise<void>;
```

Defined in: [packages/core/dist/contracts/tracer.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/tracer.d.ts)

Force-flush any pending spans.

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`Tracer`](/api/@graphorin/core/interfaces/Tracer.md).[`shutdown`](/api/@graphorin/core/interfaces/Tracer.md#shutdown)

***

### span()

```ts
span<T, R>(opts, fn): Promise<R>;
```

Defined in: [packages/core/dist/contracts/tracer.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/tracer.d.ts)

Convenience wrapper: start a span, run `fn` inside, and call
`setStatus('ok' | 'error')` + `end()` based on the outcome.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |
| `R` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`StartSpanOptions`](/api/@graphorin/core/interfaces/StartSpanOptions.md)\&lt;`T`\&gt; |
| `fn` | (`span`) => `R` \| `Promise`\&lt;`R`\&gt; |

#### Returns

`Promise`\&lt;`R`\&gt;

#### Inherited from

[`Tracer`](/api/@graphorin/core/interfaces/Tracer.md).[`span`](/api/@graphorin/core/interfaces/Tracer.md#span)

***

### startSpan()

```ts
startSpan<T>(opts): AISpan<T>;
```

Defined in: [packages/core/dist/contracts/tracer.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/tracer.d.ts)

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`StartSpanOptions`](/api/@graphorin/core/interfaces/StartSpanOptions.md)\&lt;`T`\&gt; |

#### Returns

[`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;`T`\&gt;

#### Inherited from

[`Tracer`](/api/@graphorin/core/interfaces/Tracer.md).[`startSpan`](/api/@graphorin/core/interfaces/Tracer.md#startspan)
