[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Tracer

# Interface: Tracer

Defined in: packages/core/src/contracts/tracer.ts:176

**`Stable`**

Pluggable tracer. Implementations live in `@graphorin/observability`.
The interface intentionally mirrors a subset of the OTel API so that
adapter code is a thin pass-through.

## Extended by

- [`GraphorinTracer`](/api/@graphorin/observability/interfaces/GraphorinTracer.md)

## Methods

### shutdown()

```ts
shutdown(): Promise<void>;
```

Defined in: packages/core/src/contracts/tracer.ts:187

Force-flush any pending spans.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### span()

```ts
span<T, R>(opts, fn): Promise<R>;
```

Defined in: packages/core/src/contracts/tracer.ts:182

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

***

### startSpan()

```ts
startSpan<T>(opts): AISpan<T>;
```

Defined in: packages/core/src/contracts/tracer.ts:177

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
