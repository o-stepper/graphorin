[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SpanStatus

# Type Alias: SpanStatus

```ts
type SpanStatus = "ok" | "error" | "cancelled";
```

Defined in: packages/core/src/contracts/tracer.ts:94

**`Stable`**

Status of a finished span. Mirrors the OTel status convention with
`'ok' | 'error'` short forms instead of the verbose tristate.
