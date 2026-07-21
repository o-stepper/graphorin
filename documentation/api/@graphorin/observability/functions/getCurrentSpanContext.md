[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / getCurrentSpanContext

# Function: getCurrentSpanContext()

```ts
function getCurrentSpanContext(): 
  | {
  spanId: string;
  traceId: string;
}
  | undefined;
```

Defined in: packages/observability/src/logger/logger.ts:77

**`Stable`**

Read the current span context (if any). Useful for callers that
want to attach span metadata to bespoke records.

## Returns

  \| \{
  `spanId`: `string`;
  `traceId`: `string`;
\}
  \| `undefined`
