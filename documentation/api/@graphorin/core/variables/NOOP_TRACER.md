[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / NOOP\_TRACER

# Variable: NOOP\_TRACER

```ts
const NOOP_TRACER: Tracer;
```

Defined in: packages/core/src/contracts/tracer.ts:196

**`Stable`**

Minimal no-op tracer. Useful as a typed default when downstream code
needs a non-null `Tracer` without taking the observability dependency.
