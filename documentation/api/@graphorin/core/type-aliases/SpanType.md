[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SpanType

# Type Alias: SpanType

```ts
type SpanType = 
  | KnownSpanType
  | CustomSpanType;
```

Defined in: [packages/core/src/contracts/tracer.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tracer.ts#L83)

Discriminator union for typed observability spans: every
[KnownSpanType](/api/@graphorin/core/type-aliases/KnownSpanType.md) literal plus the [CustomSpanType](/api/@graphorin/core/type-aliases/CustomSpanType.md)
namespaced escape. Exhaustive switches over `SpanType` need a
default branch for the custom domain.

## Stable
