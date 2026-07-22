[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / OPERATION\_NAME\_TABLE

# Variable: OPERATION\_NAME\_TABLE

```ts
const OPERATION_NAME_TABLE: ReadonlyArray<readonly [SpanType, GenAIOperationName]> = TABLE;
```

Defined in: packages/observability/src/gen-ai/operation-mapping.ts:89

**`Stable`**

Full canonical span-to-operation table - exposed for tooling
(documentation generators, fixture tests) that need to introspect
the mapping.
