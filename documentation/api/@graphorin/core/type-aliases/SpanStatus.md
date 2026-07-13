[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SpanStatus

# Type Alias: SpanStatus

```ts
type SpanStatus = "ok" | "error" | "cancelled";
```

Defined in: [packages/core/src/contracts/tracer.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tracer.ts#L94)

Status of a finished span. Mirrors the OTel status convention with
`'ok' | 'error'` short forms instead of the verbose tristate.

## Stable
